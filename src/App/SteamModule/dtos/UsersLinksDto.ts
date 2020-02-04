import {
	ApiProperty
} from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsArray,
	ArrayMinSize,
	ArrayMaxSize,
	ArrayUnique,
	IsUrl,
	Matches
} from 'class-validator';

export class UsersLinksDto {

	@ApiProperty()
	@IsNotEmpty()
	@IsArray()
	@ArrayMinSize(2)
	@ArrayMaxSize(20)
	@ArrayUnique()
	@IsUrl({}, {
		each: true
	})
	@Matches(/^https:\/\/steamcommunity\.com\/id\/[^/]+\/?$/, {
		each: true
	})
	readonly links: string[];
}
