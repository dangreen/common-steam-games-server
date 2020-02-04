import {
	Module
} from '@nestjs/common';
import SteamModule from './SteamModule';

@Module({
	imports: [
		SteamModule
	]
})
export default class AppModule {}
