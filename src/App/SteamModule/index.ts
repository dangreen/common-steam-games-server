import {
	Module,
	Logger
} from '@nestjs/common';
import AxiosService from '~/App/services/AxiosService';
import SteamService from './services/SteamService';
import SteamController from './SteamController';

export {
	SteamService
};

@Module({
	providers: [
		Logger,
		SteamService,
		AxiosService
	],
	controllers: [
		SteamController
	],
	exports:   [
		SteamService
	]
})
export default class CustomerModule {}
