import {
	UseInterceptors,
	ClassSerializerInterceptor,
	Controller,
	Logger,
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
	getLoggerContext
} from '~/common';
import SteamService from './services/SteamService';
import {
	UsersLinksDto
} from './dtos';

const loggerContext = getLoggerContext(__filename);

@ApiTags('steam')
@Controller('api/steam')
@UseInterceptors(ClassSerializerInterceptor)
export default class SteamController {

	constructor(
		private readonly logger: Logger,
		private readonly steamService: SteamService
	) {}

	@Post('common-multiplayer-games')
	async commonMultiplayerGames(
		@Body() data: UsersLinksDto
	) {

		const {
			logger,
			steamService
		} = this;
		const {
			links
		} = data;

		try {

			logger.verbose('Input users links:', `${loggerContext}::commonMultiplayerGames`);
			logger.verbose(links, `${loggerContext}::commonMultiplayerGames`);

			const apps = await Promise.all(
				links.map(async (link) => {

					const steamid = await steamService.getSteamidFromLink(link);
					const apps = await steamService.getGamesList(steamid);

					return apps;
				})
			);
			const commonAppsIds = intersects(apps);
			const commonAppsIdsCount = Array.isArray(commonAppsIds)
				? commonAppsIds.length
				: commonAppsIds.size;
			const commonMultiplayerApps = [];

			logger.verbose(`Common apps count: ${commonAppsIdsCount}`, `${loggerContext}::commonMultiplayerGames`);

			for (const appid of commonAppsIds) {

				const game = await steamService.getGameInfo(appid);

				if (game.tags.includes('Multiplayer')) {
					commonMultiplayerApps.push(game);
				}
			}

			logger.verbose(`Common multiplayer apps count: ${commonMultiplayerApps.length}`, `${loggerContext}::commonMultiplayerGames`);

			return commonMultiplayerApps;

		} catch (err) {

			if (isAppError(err)) {
				throw new BadRequestException(err.message);
			}

			throw new BadRequestException();
		}
	}
}
