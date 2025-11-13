import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';

type ShopInfo = {
  price: number;
  isOnSale: boolean;
  isPromo: boolean;
};

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Cosmetic)
    private readonly cosmeticsRepo: Repository<Cosmetic>,
  ) {}

  @Cron('0 * * * *')
  async handleCron() {
    this.logger.log('Executando sync automático com Fortnite API...');
    try {
      const result = await this.syncNow();
      this.logger.log(
        `Sync concluído. Criados: ${result.created}, Atualizados: ${result.updated}`,
      );
    } catch (error) {
      this.logger.error('Erro ao executar sync automático', error);
    }
  }

  async syncNow() {
    const allRes = await firstValueFrom(
      this.http.get('/cosmetics', {
        params: { language: 'pt-BR' },
      }),
    );

    const rawAll = allRes.data?.data.br;
    const allItems: any[] = Array.isArray(rawAll) ? rawAll : [];

    if (!Array.isArray(allItems)) {
      this.logger.warn(
        'Resposta inesperada de /cosmetics. Campo data/brItems não é array.',
      );
      this.logger.warn(JSON.stringify(allRes.data));
    }

    let newIds = new Set<string>();

    try {
      const newRes = await firstValueFrom(
        this.http.get('/cosmetics/new', {
          params: { language: 'pt-BR' },
        }),
      );

      const rawNewItems = newRes.data?.data?.items.br ?? newRes.data?.data;
      const newItems: any[] = Array.isArray(rawNewItems) ? rawNewItems : [];

      if (!Array.isArray(rawNewItems)) {
        this.logger.warn(
          'Resposta inesperada de /cosmetics/new. items/data não é array.',
        );
      }

      newIds = new Set(newItems.map((item) => item.id));
    } catch (error: any) {
      this.logger.warn(
        'Erro ao chamar /cosmetics/new. Vou prosseguir sem ele.',
        error?.message,
      );
    }

    const shopRes = await firstValueFrom(
      this.http.get('/shop', {
        params: { language: 'pt-BR' },
      }),
    );

    const shopMap = this.buildShopMap(shopRes.data?.data);

    let created = 0;
    let updated = 0;
    const now = new Date();
    const DAYS_NEW = 7;

    for (const item of allItems) {
      const mapped = this.mapCosmetic(item);
      const shopInfo = shopMap.get(mapped.externalId);

      let isNew = newIds.has(mapped.externalId);

      if (!isNew && mapped.releaseDate) {
        const diffMs = now.getTime() - mapped.releaseDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= DAYS_NEW) {
          isNew = true;
        }
      }

      const existing = await this.cosmeticsRepo.findOne({
        where: { externalId: mapped.externalId },
      });

      if (existing) {
        const cosmeticToUpdate = this.cosmeticsRepo.merge(existing, {
          name: mapped.name,
          type: mapped.type,
          rarity: mapped.rarity,
          description: mapped.description,
          imageUrl: mapped.imageUrl,
          releaseDate: mapped.releaseDate,
          isNew,
          isOnSale: shopInfo?.isOnSale ?? false,
          isPromo: shopInfo?.isPromo ?? false,
          price:
            shopInfo?.price != null && shopInfo.price >= 0
              ? shopInfo.price
              : existing.price,
          lastSyncAt: new Date(),
        });

        await this.cosmeticsRepo.save(cosmeticToUpdate);
        updated++;
      } else {
        const entity = this.cosmeticsRepo.create({
          externalId: mapped.externalId,
          name: mapped.name,
          type: mapped.type,
          rarity: mapped.rarity,
          description: mapped.description,
          imageUrl: mapped.imageUrl,
          releaseDate: mapped.releaseDate,
          isNew,
          isOnSale: shopInfo?.isOnSale ?? false,
          isPromo: shopInfo?.isPromo ?? false,
          price: shopInfo?.price ?? 0,
          lastSyncAt: new Date(),
        });

        await this.cosmeticsRepo.save(entity);
        created++;
      }
    }

    return { created, updated };
  }

  private mapCosmetic(item: any): {
    externalId: string;
    name: string;
    description?: string;
    type: string;
    rarity: string;
    imageUrl?: string;
    releaseDate?: Date;
  } {
    const externalId: string = item.id;
    const name: string = item.name;

    const description: string | undefined =
      item.description && item.description.length > 0
        ? item.description
        : undefined;

    const type: string =
      item.type?.value ??
      item.type?.backendValue ??
      item.type?.id ??
      item.type ??
      'unknown';

    const rarity: string =
      item.rarity?.value ??
      item.rarity?.backendValue ??
      item.rarity?.id ??
      item.rarity ??
      'unknown';

    const imageUrl: string | undefined =
      item.images?.icon ??
      item.images?.smallIcon ??
      item.images?.featured ??
      undefined;

    let releaseDate: Date | undefined = undefined;

    if (item.added) {
      const d = new Date(item.added);
      if (!isNaN(d.getTime())) releaseDate = d;
    } else if (item.introduction?.backendValue) {
      const d = new Date(item.introduction.backendValue);
      if (!isNaN(d.getTime())) releaseDate = d;
    }

    return {
      externalId,
      name,
      description,
      type,
      rarity,
      imageUrl,
      releaseDate,
    };
  }

  private buildShopMap(shopData: any): Map<string, ShopInfo> {
    const map = new Map<string, ShopInfo>();
    if (!shopData) return map;

    const entries = Array.isArray(shopData.entries) ? shopData.entries : [];

    for (const entry of entries) {
      const regularPrice = entry.regularPrice ?? entry.finalPrice ?? 0;
      const finalPrice = entry.finalPrice ?? regularPrice;

      const hasDiscount = finalPrice < regularPrice;
      const isOnSale = true;
      const isPromo = hasDiscount || !!entry.offerTag || !!entry.banner;

      const items = entry.brItems ?? entry.items ?? entry.tracks ?? [];

      for (const item of items) {
        const id = item.id;
        if (!id) continue;

        const info: ShopInfo = {
          price: finalPrice,
          isOnSale,
          isPromo,
        };

        const existing = map.get(id);
        if (!existing || finalPrice < existing.price) {
          map.set(id, info);
        }
      }
    }

    this.logger.log(
      `Shop mapeado para ${map.size} cosméticos com preço/onSale/promo.`,
    );

    return map;
  }
}
