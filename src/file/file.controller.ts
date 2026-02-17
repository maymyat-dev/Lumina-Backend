import {
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { FileService } from './file.service';
import { FileDto } from './dto/file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (request, file, callback) => {
        const isAllowedMimeType = file.mimetype.match(/\b(jpg|jpeg|png|gif|webp)\b/i);
        if (!isAllowedMimeType) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async fileUpload(@Req() req: Request, @UploadedFile() file: Express.Multer.File, body: FileDto) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return await this.fileService.fileUpload(body.file_path, file);
  }
}
