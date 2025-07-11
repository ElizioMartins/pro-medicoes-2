import { firstValueFrom } from 'rxjs';
import { UserService } from './core/services/user.service';
import { CondominiumService } from './core/services/condominium.service';
import { UnitService } from './core/services/Unit.service';
import { MeterService } from './core/services/meter.service';
import { MeasurementTypeService } from './core/services/measurementtype.service';
import { MeasurementType } from './shared/models/measurement-type.model';
import { Unit } from './shared/models/unit.model';
import { User } from './shared/models/user.model';
import { UserRole } from './shared/models/enums';
import { MeterCreate } from './shared/models/meter.model';
import { Condominium, CondominiumCreate } from './shared/models/condominium.model';

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
      username: 'joao',
      email: 'joao.silva@example.com',
      role: UserRole.ADMIN,
      lastAccess: undefined,
      active: true,
      initials: 'JS',
      avatarColor: '#2563eb',
      name: 'João Silva',
      status: 'Active',
      created_at: '',
      updated_at: ''
    },
    {
      username: 'maria.santos',
      email: 'maria.santos@example.com',
      name: 'Maria Santos',
      role: UserRole.MANAGER,
      status: 'Active' as const,
      active: true,
      lastAccess: undefined,
      initials: 'MS',
      avatarColor: '#2563eb',
      created_at: '',
      updated_at: ''
    },
    {
      username: 'carlos.oliveira',
      email: 'carlos.oliveira@example.com',
      name: 'Carlos Oliveira',
      role: UserRole.READER,
      status: 'Active' as const,
      active: true,
      lastAccess: undefined,
      initials: 'CO',
      avatarColor: '#0891b2',
      created_at: '',
      updated_at: ''
    }
  ];

  for (const user of initialUsers) {
    try {
      await firstValueFrom(userService.createUser({ ...user, password: 'Senha@123' }));
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
      active: true,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'Energia',
      unit: 'kWh',
      active: true,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'Gás',
      unit: 'm³',
      active: true,
      created_at: '',
      updated_at: ''
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
      unit_id: unit.id,
      measurement_type_id: type.id,
      serial_number: `${prefix}${unit.id}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      active: true,
    };

    try {
      await firstValueFrom(meterService.create(meter));
      console.log(`Medidor ${meter.serial_number} adicionado com sucesso.`);
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
      condominium_id: condominiumId,
      identifier: `Apto ${i.toString().padStart(2, '0')}`,
      owner: `Proprietário ${i}`,
      meters_count: 2,
      active: true,
      observations: `Unidade ${i} do ${condominiumName}`,
      last_reading: undefined
    };

    try {
      const createdUnit = await firstValueFrom(unitService.createUnit(condominiumId, unit));
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
      units_count: 3,
      meters_count: 6,
      readings_count: 0,
      reports_count: 0
    },
    {
      name: 'Edifício Solar',
      address: 'Rua das Palmeiras, 500 - Jardim',
      cnpj: '23.456.789/0001-01',
      manager: 'Maria Santos',
      phone: '(11) 4567-8901',
      email: 'contato@edificiosolar.com.br',
      units_count: 3,
      meters_count: 6,
      readings_count: 0,
      reports_count: 0
    },
    {
      name: 'Condomínio Vista Mar',
      address: 'Av. Beira Mar, 2500 - Praia',
      cnpj: '34.567.890/0001-12',
      manager: 'Carlos Oliveira',
      phone: '(11) 5678-9012',
      email: 'contato@vistamar.com.br',
      units_count: 3,
      meters_count: 6,
      readings_count: 0,
      reports_count: 0
    }
  ];

  // Buscar tipos de medição uma única vez
  const measurementTypes = await firstValueFrom(measurementTypeService.getMeasurementTypes());

  for (const condominium of initialCondominiums) {
    try {
      const createdCondominium = await firstValueFrom(condominiumService.createCondominium(condominium as CondominiumCreate));
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
