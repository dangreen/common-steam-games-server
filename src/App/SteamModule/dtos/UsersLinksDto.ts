import {
	ApiProperty
} from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsArray,
	ArrayMinSize,
	ArrayMaxSize,
	ArrayUnique
} from 'class-validator';

export class UsersLinksDto {

	@ApiProperty()
	@IsNotEmpty()
	@IsArray()
	@ArrayMinSize(2)
	@ArrayMaxSize(20)
	@ArrayUnique()
	readonly links: string[];
}
