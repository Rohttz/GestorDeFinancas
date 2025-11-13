import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService, DashboardSummary } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  findDashboard(@Query('usuarioId') userId: string): Promise<DashboardSummary> {
    return this.dashboardService.getSummary(userId);
  }
}
