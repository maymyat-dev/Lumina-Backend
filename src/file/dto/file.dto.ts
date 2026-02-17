import { IsNotEmpty, Matches } from 'class-validator';

export class FileDto {
  @IsNotEmpty({ message: 'Path is required' })
  @Matches(/^[a-zA-Z0-9-_]+(?:\/[a-zA-Z0-9-_]+)*$/, { message: 'Invalid Path format' })
  file_path: string;
}
