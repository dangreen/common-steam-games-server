import {
	Injectable,
	Inject,
	Logger
} from '@nestjs/common';
import rateLimit from 'axios-rate-limit';
import {
	AppError,
	getLoggerContext,
	printError
} from '~/common';
import {
	AxiosServiceToken,
	AxiosInstance,
	AxiosConstructor
} from '~/App/services/AxiosService';
import {
	IAppInfo
} from './SteamServices.types';

export * from './SteamServices.types';

const loggerContext = getLoggerContext(__filename);

@Injectable()
export default class SteamService {

	private static readonly steamspyTimeoutTime = 1000;
	private static readonly steamspyRequestsLimit = 4;
	private readonly axios: AxiosInstance;
	private readonly steamspyAxios: AxiosInstance;

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
		let steamid: string = null;

		logger.verbose(`Input link: ${link}`, `${loggerContext}::getSteamidFromLink`);

		try {

			const [, vanityurl] = /(?:^|\/)([^\/]+)\/?$/.exec(link);

			logger.verbose(`vanityurl: ${vanityurl} (for ${link})`, `${loggerContext}::getSteamidFromLink`);

			if (/^\d+$/.test(vanityurl)) {
				steamid = vanityurl;
			} else {

				const response = await axios.get('http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001', {
					params: {
						key:    process.env.STEAM_KEY,
						format: 'json',
						vanityurl
					}
				});
				({
					steamid
				} = response.data.response);
			}

		} catch (catchedError) {
			printError(logger, catchedError, `${loggerContext}::getSteamidFromLink`);
			throw new AppError(`Invalid steam user's link: ${link}`);
		}

		logger.verbose(`Result: ${steamid} (for ${link})`, `${loggerContext}::getSteamidFromLink`);

		return steamid;
	}

	async getGamesList(steamidOrLink: string) {

		const {
			logger,
			axios
		} = this;

		logger.verbose(`Input steamid or link: ${steamidOrLink}`, `${loggerContext}::getGamesList`);

		const steamid = await this.getSteamidFromLink(steamidOrLink);

		try {

			const response = await axios.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001', {
				params: {
					key:                       process.env.STEAM_KEY,
					format:                    'json',
					include_played_free_games: false,
					steamid
				}
			});
			const {
				games
			} = response.data.response;
			const appIds: number[] = games.map(({ appid }) => appid);

			logger.verbose(`Games count: ${appIds.length} (for ${steamidOrLink})`, `${loggerContext}::getGamesList`);

			return appIds;

		} catch (catchedError) {
			printError(logger, catchedError, `${loggerContext}::getGamesList`);
			throw new AppError(`Can't get ${steamidOrLink}'s games`);
		}
	}

	async getGameInfo(appid: number) {

		const {
			logger,
			steamspyAxios
		} = this;

		logger.verbose(`Input appid: ${appid}`, `${loggerContext}::getGameInfo`);

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
				id:   appid,
				name: data.name,
				tags: Object.keys(data.tags)
			};

			logger.verbose(`Success (for ${appid})`, `${loggerContext}::getGameInfo`);

			return appInfo;

		} catch (catchedError) {
			printError(logger, catchedError, `${loggerContext}::getGameInfo`);
			throw new AppError(`Can't get info about app with appid ${appid}`);
		}
	}

	async getGamesInfoByTag(tag: string) {

		const {
			logger,
			steamspyAxios
		} = this;

		logger.verbose(`Input tag: ${tag}`, `${loggerContext}::getGamesInfoByTag`);

		try {

			const response = await steamspyAxios.get('https://steamspy.com/api.php', {
				params: {
					request: 'tag',
					tag
				}
			});
			const {
				data
			} = response;
			const appsInfo = Object.entries(data).reduce((
				appsInfo,
				[idString, info]: [string, any]
			) => {

				const id = parseInt(idString, 10);

				appsInfo.set(id, {
					id,
					name: info.name
				});

				return appsInfo;
			}, new Map<number, IAppInfo>());

			logger.verbose(`Success (for ${tag})`, `${loggerContext}::getGamesInfoByTag`);

			return appsInfo;

		} catch (catchedError) {
			printError(logger, catchedError, `${loggerContext}::getGamesInfoByTag`);
			throw new AppError(`Can't get info about apps with tag ${tag}`);
		}
	}
}
