import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly i18n: I18nService,
  ) {}

  @Get('provinces')
  async getProvinces() {
    return await this.locationsService.getProvinces();
  }

  @Get('provinces/:id/districts')
  async getDistricts(@Param('id') provinceId: string) {
    const districts = await this.locationsService.getDistricts(provinceId);
    if (!districts || districts.length === 0) {
      const lang = I18nContext.current()?.lang || 'vi';
      throw new NotFoundException(
        this.i18n.t('locations.PROV_NOT_FOUND', { lang }),
      );
    }
    return districts;
  }

  @Get('districts/:id/wards')
  async getWards(@Param('id') districtId: string) {
    const wards = await this.locationsService.getWards(districtId);
    if (!wards || wards.length === 0) {
      const lang = I18nContext.current()?.lang || 'vi';
      throw new NotFoundException(
        this.i18n.t('locations.DIST_NOT_FOUND', { lang }),
      );
    }
    return wards;
  }
}
