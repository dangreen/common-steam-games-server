import {
	UseInterceptors,
	ClassSerializerInterceptor,
	Logger
} from '@nestjs/common';
import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	WsException
} from '@nestjs/websockets';
import {
	Socket
} from 'socket.io';
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

@UseInterceptors(ClassSerializerInterceptor)
@WebSocketGateway()
export default class SteamGateway {

	constructor(
		private readonly logger: Logger,
		private readonly steamService: SteamService
	) {}

	@SubscribeMessage('commonMultiplayerGames')
	async commonMultiplayerGames(
		@MessageBody() data: UsersLinksDto,
		@ConnectedSocket() client: Socket
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
			const commonAppsIds = Array.from(intersects(apps));

			logger.verbose(`Common apps count: ${commonAppsIds.length}`, `${loggerContext}::commonMultiplayerGames`);

			const commonApps = await Promise.all(
				commonAppsIds.map(async (appid) => {

					const game = await steamService.getGameInfo(appid);

					if (game.tags.includes('Multiplayer')) {
						client.emit('commonMultiplayerGames', {
							done: true,
							game
						});
						return game;
					}

					return null;
				})
			);
			const commonMultiplayerApps = commonApps.filter(Boolean);

			logger.verbose(`Common multiplayer apps count: ${commonMultiplayerApps.length}`, `${loggerContext}::commonMultiplayerGames`);

			client.emit('commonMultiplayerGames', {
				done: true
			});

		} catch (err) {

			if (isAppError(err)) {
				throw new WsException(err.message);
			}

			throw new WsException('Server error');
		}
	}
}
