import {
	UseInterceptors,
	ClassSerializerInterceptor,
	Controller,
	OnModuleDestroy,
	Logger,
	HttpStatus,
	HttpCode,
	Post,
	Body,
	BadRequestException
} from '@nestjs/common';
import {
	ApiTags
} from '@nestjs/swagger';
import {
	isAppError,
	intersects,
	getLoggerContext,
	createStringPropComparator
} from '~/common';
import SteamService, {
	IAppInfo
} from './services/SteamService';
import {
	UsersLinksDto
} from './dtos';

const loggerContext = getLoggerContext(__filename);
const namePropComparator = createStringPropComparator('name');

@ApiTags('steam')
@Controller('api/steam')
@UseInterceptors(ClassSerializerInterceptor)
export default class SteamController implements OnModuleDestroy {

	private static readonly multiplayerGamesCacheUpdateInterval = 1000 * 60 * 5;
	private readonly multiplayerGamesCacheUpdateIntervalId: NodeJS.Timeout = null;
	private multiplayerGamesCacheAccess: Promise<Map<number, IAppInfo>> = null;

	constructor(
		private readonly logger: Logger,
		private readonly steamService: SteamService
	) {

		this.updateMultiplayerGamesCache();

		this.multiplayerGamesCacheUpdateIntervalId = setInterval(
			this.updateMultiplayerGamesCache.bind(this),
			SteamController.multiplayerGamesCacheUpdateInterval
		);
	}

	onModuleDestroy() {
		clearInterval(this.multiplayerGamesCacheUpdateIntervalId);
	}

	@Post('common-multiplayer-games')
	@HttpCode(HttpStatus.OK)
	async commonMultiplayerGames(
		@Body() data: UsersLinksDto
	) {

		const {
			logger,
			steamService,
			multiplayerGamesCacheAccess
		} = this;
		const {
			links
		} = data;

		try {

			logger.verbose('Input users links:', `${loggerContext}::commonMultiplayerGames`);
			logger.verbose(links, `${loggerContext}::commonMultiplayerGames`);

			const apps = await Promise.all(
				links.map(
					link => steamService.getGamesList(link)
				)
			);
			const commonAppsIds = Array.from(intersects(apps));

			logger.verbose(`Common apps count: ${commonAppsIds.length}`, `${loggerContext}::commonMultiplayerGames`);

			const multiplayerGamesCache = await multiplayerGamesCacheAccess;
			const commonMultiplayerApps = commonAppsIds.map((appid) => {

				if (multiplayerGamesCache.has(appid)) {
					return multiplayerGamesCache.get(appid);
				}

				return null;
			}).filter(Boolean).sort(namePropComparator);

			logger.verbose(`Common multiplayer apps count: ${commonMultiplayerApps.length}`, `${loggerContext}::commonMultiplayerGames`);

			return commonMultiplayerApps;

		} catch (err) {

			if (isAppError(err)) {
				throw new BadRequestException(err.message);
			}

			throw new BadRequestException();
		}
	}

	private async updateMultiplayerGamesCache() {

		const {
			logger,
			steamService
		} = this;

		logger.verbose('Updating of multiplayer games cache...', `${loggerContext}::commonMultiplayerGames`);

		this.multiplayerGamesCacheAccess = steamService.getGamesInfoByTag('Multiplayer');
	}
}
