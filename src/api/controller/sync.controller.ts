import { Controller, Post } from '@nestjs/common';
import { SyncService } from '../service/sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('run')
  async runManualSync() {
    const result = await this.syncService.syncNow();
    return {
      message: 'Sync executado com sucesso.',
      ...result,
    };
  }
}
