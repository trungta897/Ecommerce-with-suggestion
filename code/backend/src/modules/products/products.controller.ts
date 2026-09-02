import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('all') all?: string,
    @Query('q') q?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('sort') sort?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const includeInactive = all === 'true';
    return this.productsService.findAll(
      pageNum,
      limitNum,
      categorySlug,
      includeInactive,
      q,
      minPrice,
      maxPrice,
      minRating,
      sort,
    );
  }

  @Get('home-sections')
  getHomeSections(
    @Query('slugs') slugs?: string,
    @Query('limit') limit?: string,
  ) {
    const slugList = slugs
      ? slugs.split(',').map((s) => s.trim())
      : ['laptop', 'man-hinh', 'may-tinh-de-ban', 'o-cung', 'vga', 'ram'];
    const limitNum = limit ? parseInt(limit, 10) : 8;
    return this.productsService.getHomeSections(slugList, limitNum);
  }

  @Get('slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.productsService.findBySlug(slug, lang);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.productsService.findById(id, lang);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.productsService.create(createProductDto, lang);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.productsService.update(id, updateProductDto, lang);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.productsService.remove(id, lang);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.productsService.uploadImage(file);
    return { url };
  }
}
