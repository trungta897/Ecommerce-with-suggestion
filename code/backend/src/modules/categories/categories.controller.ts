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
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    const includeInactive = all === 'true';
    return this.categoriesService.findAll(includeInactive);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.categoriesService.findOne(id, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.categoriesService.create(createCategoryDto, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.categoriesService.update(id, updateCategoryDto, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.categoriesService.remove(id, lang);
  }
}
