import { ObjectCannedACL, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { AvailableFormatInfo, FormatEnum } from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly s3Client: S3Client;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly s3Bucket: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    this.accessKeyId = this.configService.getOrThrow<string>('S3_ACCESS_KEY');
    this.secretAccessKey = this.configService.getOrThrow<string>('S3_SECRET_KEY');
    this.s3Bucket = this.configService.getOrThrow<string>('S3_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async processImage(
    buffer: Buffer,
    format: AvailableFormatInfo | keyof FormatEnum,
  ): Promise<Buffer> {
    const formatString = typeof format === 'string' ? format : format.id;

    if (!formatString) {
      throw new Error('Invalid format. Format must be a string or a FormatEnum key with an id.');
    }

    return sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .toFormat(formatString as keyof FormatEnum)
      .toBuffer();
  }

  private generateNewFilename(path: string, originalName: string): string {
    const uniqueId = uuidv4();
    const slicedName = originalName.slice(0, 3);
    return `${path}/${Date.now()}_${uniqueId}_${slicedName}`;
  }

  async fileUpload(path: string, file: Express.Multer.File) {
    let processedBuffer = file.buffer;
    let contentType = file.mimetype;
    const keyName = this.generateNewFilename(path, file.originalname);

    const params = {
      Bucket: this.s3Bucket,
      Key: keyName,
      Body: processedBuffer,
      ACL: ObjectCannedACL.public_read,
      ContentType: contentType,
    };
    try {
      if (file.mimetype.startsWith('html')) {
        throw new Error('Malicious file type');
      }

      if (file.mimetype.startsWith('image/')) {
        const format = file.mimetype.split('/')[1] as keyof FormatEnum | AvailableFormatInfo;
        const formatString = typeof format === 'string' ? format : format.id;

        if (formatString !== 'svg+xml') {
          processedBuffer = await this.processImage(file.buffer, format);
          contentType = `image/${formatString}`;
        }
      } else {
        throw new Error('Malicious file type');
      }
      const upload = new Upload({
        client: this.s3Client,
        params,
      });

      const s3Response = await upload.done();
      return { data: { url: s3Response.Location, file_key: s3Response.Key } };
    } catch (error) {
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }
}
