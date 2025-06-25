import { firstValueFrom } from 'rxjs';
import { UserService } from './core/services/user.service';
import { CondominiumService } from './core/services/Condominium.service';
import { UnitService } from './core/services/Unit.service';
import { MeterService } from './core/services/Meter.service';
import { MeasurementTypeService } from './core/services/MeasurementType.service';
import { User } from './shared/models/user.model';
import { UserRole } from './shared/models/enums';

export async function initializeDatabase(
  userService: UserService,
  condominiumService: CondominiumService,
  unitService: UnitService,
  meterService: MeterService,
  measurementTypeService: MeasurementTypeService
) {
  await initializeUsers(userService);
  await initializeMeasurementTypes(measurementTypeService);
  await initializeCondominiums(condominiumService, unitService, meterService, measurementTypeService);
}

async function initializeUsers(userService: UserService) {
  const initialUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      username: 'joao.silva',
      email: 'joao.silva@example.com',
      role: UserRole.ADMIN,
      lastAccess: null,
      active: true,
      initials: 'JS',
      avatarColor: '#7c3aed'
    },
    {
      username: 'maria.santos',
      email: 'maria.santos@example.com',
      password: 'Senha@123',
      name: 'Maria Santos',
      role: 'Manager' as const,
      status: 'Active' as const,
      active: true,
      lastAccess: null,
      initials: 'MS',
      avatarColor: '#2563eb'
    },
    {
      username: 'carlos.oliveira',
      email: 'carlos.oliveira@example.com',
      password: 'Senha@123',
      name: 'Carlos Oliveira',
      role: 'Reader' as const,
      status: 'Active' as const,
      active: true,
      lastAccess: null,
      initials: 'CO',
      avatarColor: '#0891b2'
    }
  ];

  for (const user of initialUsers) {
    try {
      await firstValueFrom(userService.createUser(user));
      console.log(`Usuário ${user.username} adicionado com sucesso.`);
    } catch (error: any) {
      if (error?.status === 409) {
        console.log(`Usuário ${user.username} já existe.`);
      } else {
        console.error(`Erro ao adicionar usuário ${user.username}:`, error);
      }
    }
  }
}

async function initializeMeasurementTypes(measurementTypeService: MeasurementTypeService) {
  const initialTypes: Omit<MeasurementType, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Água',
      unit: 'm³',
      active: true
    },
    {
      name: 'Energia',
      unit: 'kWh',
      active: true
    },
    {
      name: 'Gás',
      unit: 'm³',
      active: true
    }
  ];

  for (const type of initialTypes) {
    try {
      await firstValueFrom(measurementTypeService.addMeasurementType(type));
      console.log(`Tipo de medição ${type.name} adicionado com sucesso.`);
    } catch (error: any) {
      if (error?.status === 409) {
        console.log(`Tipo de medição ${type.name} já existe.`);
      } else {
        console.error(`Erro ao adicionar tipo de medição ${type.name}:`, error);
      }
    }
  }
}

async function createUnitMeters(
  unit: Unit,
  measurementTypes: MeasurementType[],
  meterService: MeterService
) {
  const waterType = measurementTypes.find(t => t.name === 'Água');
  const energyType = measurementTypes.find(t => t.name === 'Energia');

  const meterTypes = [
    { type: waterType, prefix: 'AE' }, // Água
    { type: energyType, prefix: 'EE' }  // Energia
  ];

  for (const { type, prefix } of meterTypes) {
    if (!type) {
      console.error('Tipo de medição não encontrado');
      continue;
    }

    const meter: MeterCreate = {
      unitId: unit.id,
      measurementTypeId: type.id,
      serialNumber: `${prefix}${unit.id}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      active: true,
      lastReadingDate: null
    };

    try {
      await firstValueFrom(meterService.createMeter(meter));
      console.log(`Medidor ${meter.serialNumber} adicionado com sucesso.`);
    } catch (error: any) {
      console.error(`Erro ao adicionar medidor para unidade ${unit.identifier}:`, error);
    }
  }
}

async function createCondominiumUnits(
  condominiumId: number,
  condominiumName: string,
  unitService: UnitService,
  meterService: MeterService,
  measurementTypes: MeasurementType[]
) {
  for (let i = 1; i <= 3; i++) {
    const unit: Partial<Unit> = {
      condominiumId: condominiumId,
      identifier: `Apto ${i.toString().padStart(2, '0')}`,
      owner: `Proprietário ${i}`,
      metersCount: 2,
      active: true,
      observations: `Unidade ${i} do ${condominiumName}`,
      lastReading: undefined
    };

    try {
      const createdUnit = await firstValueFrom(unitService.createUnit(unit));
      console.log(`Unidade ${unit.identifier} adicionada com sucesso.`);

      await createUnitMeters(createdUnit, measurementTypes, meterService);
    } catch (error: any) {
      console.error(`Erro ao adicionar unidade ${unit.identifier}:`, error);
    }
  }
}

async function initializeCondominiums(
  condominiumService: CondominiumService,
  unitService: UnitService,
  meterService: MeterService,
  measurementTypeService: MeasurementTypeService
) {
  const initialCondominiums: Partial<Condominium>[] = [
    {
      name: 'Residencial Parque das Flores',
      address: 'Av. Principal, 1000 - Centro',
      cnpj: '12.345.678/0001-90',
      manager: 'João Silva',
      phone: '(11) 3456-7890',
      email: 'contato@parquedasflores.com.br',
      unitsCount: 3,
      metersCount: 6,
      readingsCount: 0,
      reportsCount: 0
    },
    {
      name: 'Edifício Solar',
      address: 'Rua das Palmeiras, 500 - Jardim',
      cnpj: '23.456.789/0001-01',
      manager: 'Maria Santos',
      phone: '(11) 4567-8901',
      email: 'contato@edificiosolar.com.br',
      unitsCount: 3,
      metersCount: 6,
      readingsCount: 0,
      reportsCount: 0
    },
    {
      name: 'Condomínio Vista Mar',
      address: 'Av. Beira Mar, 2500 - Praia',
      cnpj: '34.567.890/0001-12',
      manager: 'Carlos Oliveira',
      phone: '(11) 5678-9012',
      email: 'contato@vistamar.com.br',
      unitsCount: 3,
      metersCount: 6,
      readingsCount: 0,
      reportsCount: 0
    }
  ];

  // Buscar tipos de medição uma única vez
  const measurementTypes = await firstValueFrom(measurementTypeService.getMeasurementTypes());

  for (const condominium of initialCondominiums) {
    try {
      const createdCondominium = await firstValueFrom(condominiumService.createCondominium(condominium));
      console.log(`Condomínio ${condominium.name} adicionado com sucesso.`);

      await createCondominiumUnits(
        createdCondominium.id,
        createdCondominium.name,
        unitService,
        meterService,
        measurementTypes
      );
    } catch (error: any) {
      if (error?.status === 409) {
        console.log(`Condomínio ${condominium.name} já existe.`);
      } else {
        console.error(`Erro ao adicionar condomínio ${condominium.name}:`, error);
      }
    }
  }
}
