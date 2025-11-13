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

  // roda de hora em hora (opcional)
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
    // 1) COSMÉTICOS
    const allRes = await firstValueFrom(
      this.http.get('/cosmetics', {
        params: { language: 'pt-BR' },
      }),
    );

    /**
     * Formato típico:
     * { status: 200, data: [ ...brItems ] }
     * ou em alguns casos { data: { brItems: [...] } }
     */
    const rawAll = allRes.data?.data.br;
    const allItems: any[] = Array.isArray(rawAll) ? rawAll : [];

    if (!Array.isArray(allItems)) {
      this.logger.warn(
        'Resposta inesperada de /cosmetics. Campo data/brItems não é array.',
      );
      this.logger.warn(JSON.stringify(allRes.data));
    }

  // 2) COSMÉTICOS NOVOS (best effort)
    let newIds = new Set<string>();

    try {
      const newRes = await firstValueFrom(
        this.http.get('/cosmetics/new', {
          params: { language: 'pt-BR' },
        }),
      );

      /**
       * Pode vir como:
       * - { status, data: { items: [...] } }
       * - ou { status, data: [...] }
       */
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


    // 3) SHOP (preço / onSale / promo)
    const shopRes = await firstValueFrom(
      this.http.get('/shop', {
        params: { language: 'pt-BR' },
      }),
    );

    /**
     * Exemplo real que você mandou:
     * {
     *   status: 200,
     *   data: {
     *     hash: "...",
     *     date: "...",
     *     vbuckIcon: "...",
     *     entries: [
     *       {
     *         regularPrice: 500,
     *         finalPrice: 500,
     *         brItems: [
     *           { id: "Character_ThinGlaze", name: "...", ... }
     *         ]
     *       }
     *     ]
     *   }
     * }
     */
    const shopMap = this.buildShopMap(shopRes.data?.data);

    let created = 0;
    let updated = 0;
    const now = new Date();
    const DAYS_NEW = 7; // "novo" = últimos 7 dias

    for (const item of allItems) {
      const mapped = this.mapCosmetic(item);
      const shopInfo = shopMap.get(mapped.externalId); // externalId = id do brItem

      // FLAG isNew: combina /cosmetics/new + data de lançamento
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

  /**
   * Mapeia um brItem da Fortnite API para a entidade Cosmetic
   */
  private mapCosmetic(item: any): {
    externalId: string;
    name: string;
    description?: string;
    type: string;
    rarity: string;
    imageUrl?: string;
    releaseDate?: Date;
  } {
    // esse id é o mesmo que aparece no brItems do shop
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

  /**
   * Monta um Map<idDoCosméticoBR, ShopInfo> com base em data.entries[].brItems[]
   */
  private buildShopMap(shopData: any): Map<string, ShopInfo> {
    const map = new Map<string, ShopInfo>();
    if (!shopData) return map;

    const entries = Array.isArray(shopData.entries) ? shopData.entries : [];

    for (const entry of entries) {
      const regularPrice = entry.regularPrice ?? entry.finalPrice ?? 0;
      const finalPrice = entry.finalPrice ?? regularPrice;

      const hasDiscount = finalPrice < regularPrice;

      // aqui "onSale" = está à venda (está em entries)
      const isOnSale = true;

      // promo = desconto OU algum destaque visual
      const isPromo = hasDiscount || !!entry.offerTag || !!entry.banner;

      const items = entry.brItems ?? entry.items ?? entry.tracks ?? [];

      for (const item of items) {
        const id = item.id; // ex: "Character_ThinGlaze"
        if (!id) continue;

        const info: ShopInfo = {
          price: finalPrice,
          isOnSale,
          isPromo,
        };

        const existing = map.get(id);
        // se o item aparecer em mais de uma entry, guarda o menor preço
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
