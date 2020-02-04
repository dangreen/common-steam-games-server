import {
	Injectable,
	Inject,
	Logger
} from '@nestjs/common';
import rateLimit from 'axios-rate-limit';
import {
	AppError,
	getLoggerContext
} from '~/common';
import {
	AxiosServiceToken,
	AxiosInstance,
	AxiosConstructor
} from '~/App/services/AxiosService';
import {
	IAppInfo
} from './SteamServices.types';

const loggerContext = getLoggerContext(__filename);

@Injectable()
export default class SteamService {

	private static readonly steamspyTimeoutTime = 1000;
	private static readonly steamspyRequestsLimit = 4;
	private static readonly appsCacheLimit = 10000;
	private readonly axios: AxiosInstance;
	private readonly steamspyAxios: AxiosInstance;
	private readonly appsCache = new Map<number, IAppInfo>();

	constructor(
		private readonly logger: Logger,
		@Inject(AxiosServiceToken) createAxios: AxiosConstructor
	) {
		this.axios = createAxios();
		this.steamspyAxios = rateLimit(createAxios(), {
			maxRequests:     SteamService.steamspyRequestsLimit,
			perMilliseconds: SteamService.steamspyTimeoutTime
		});
	}

	async getSteamidFromLink(link: string) {

		const {
			logger,
			axios
		} = this;

		logger.verbose(`Input link: ${link}`, `${loggerContext}::getSteamidFromLink`);

		try {

			const response = await axios.get<string>(link, {
				responseType: 'text'
			});
			const html = response.data;
			const [, id] = /"steamid":"([^"]+)"/.exec(html);

			logger.verbose(`Result: ${id}`, `${loggerContext}::getSteamidFromLink`);

			return id;

		} catch (catchedError) {
			const err = new AppError(`Error while handling link: ${link}`);
			this.logger.error(
				catchedError.message,
				catchedError.stack,
				`${loggerContext}::getSteamidFromLink`
			);
			throw err;
		}
	}

	async getGamesList(steamid: string) {

		const {
			logger,
			axios
		} = this;

		logger.verbose(`Input steamid: ${steamid}`, `${loggerContext}::getGamesList`);

		try {

			const response = await axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001', {
				params: {
					key: process.env.STEAM_KEY,
					format: 'json',
					include_played_free_games: false,
					steamid
				}
			});
			const {
				games
			} = response.data.response;
			const appIds: number[] = games.map(({ appid }) => appid);

			logger.verbose(`Games count: ${appIds.length}`, `${loggerContext}::getGamesList`);

			return appIds;

		} catch (catchedError) {
			const err = new AppError(`Error while handling steamid: ${steamid}`);
			this.logger.error(
				catchedError.message,
				catchedError.stack,
				`${loggerContext}::getGamesList`
			);
			throw err;
		}
	}

	async getGameInfo(appid: number) {

		const {
			logger,
			steamspyAxios,
			appsCache
		} = this;

		logger.verbose(`Input appid: ${appid}`, `${loggerContext}::getGameInfo`);

		if (appsCache.has(appid)) {
			logger.verbose(`Success from cache (${appid})`, `${loggerContext}::getGameInfo`);
			return appsCache.get(appid);
		}

		try {

			const response = await steamspyAxios.get('https://steamspy.com/api.php', {
				params: {
					request: 'appdetails',
					appid
				}
			});
			const {
				data
			} = response;
			const appInfo: IAppInfo = {
				id: appid,
				name: data.name,
				tags: Object.keys(data.tags)
			};

			if (appsCache.size > SteamService.appsCacheLimit) {
				appsCache.delete(appsCache.keys().next().value);
			}

			appsCache.set(appid, appInfo);

			logger.verbose('Success', `${loggerContext}::getGameInfo`);

			return appInfo;

		} catch (catchedError) {
			const err = new AppError(`Error while handling appid: ${appid}`);
			this.logger.error(
				catchedError.message,
				catchedError.stack,
				`${loggerContext}::getGameInfo`
			);
			throw err;
		}
	}
}
