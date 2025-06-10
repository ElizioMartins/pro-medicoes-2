import { firstValueFrom } from 'rxjs';
import { UserService } from './core/services/user.service';
import { CondominiumService } from './core/services/Condominium.service';
import { User, UserCreate } from './core/models/User';
import { Condominium } from './core/models/Condominium';

export async function initializeDatabase(
  userService: UserService,
  condominiumService: CondominiumService
) {
  await initializeUsers(userService);
  await initializeCondominiums(condominiumService);
}

async function initializeUsers(userService: UserService) {
  const initialUsers: UserCreate[] = [
    {
      username: 'joao.silva',
      email: 'joao.silva@example.com',
      password: 'Senha@123',
      name: 'João Silva',
      role: 'Admin' as const,
      status: 'Active' as const,
      is_active: 1,
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
      is_active: 1,
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
      is_active: 1,
      initials: 'CO',
      avatarColor: '#0891b2'
    }
  ];for (const user of initialUsers) {
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

async function initializeCondominiums(condominiumService: CondominiumService) {
  const initialCondominiums: Partial<Condominium>[] = [
    {
      name: 'Residencial Parque das Flores',
      address: 'Av. Principal, 1000 - Centro',
      cnpj: '12.345.678/0001-90',
      manager: 'João Silva',
      phone: '(11) 3456-7890',
      email: 'contato@parquedasflores.com.br',
      unitsCount: 120,
      metersCount: 360,
      readingsCount: 1240,
      reportsCount: 24
    },
    {
      name: 'Edifício Solar',
      address: 'Rua das Palmeiras, 500 - Jardim',
      cnpj: '23.456.789/0001-01',
      manager: 'Maria Santos',
      phone: '(11) 4567-8901',
      email: 'contato@edificiosolar.com.br',
      unitsCount: 48,
      metersCount: 144,
      readingsCount: 520,
      reportsCount: 12
    },
    {
      name: 'Condomínio Vista Mar',
      address: 'Av. Beira Mar, 2500 - Praia',
      cnpj: '34.567.890/0001-12',
      manager: 'Carlos Oliveira',
      phone: '(11) 5678-9012',
      email: 'contato@vistamar.com.br',
      unitsCount: 80,
      metersCount: 240,
      readingsCount: 960,
      reportsCount: 18
    }
  ];for (const condominium of initialCondominiums) {
    try {
      await firstValueFrom(condominiumService.createCondominium(condominium));
      console.log(`Condomínio ${condominium.name} adicionado com sucesso.`);
    } catch (error: any) {
      if (error?.status === 409) {
        console.log(`Condomínio ${condominium.name} já existe.`);
      } else {
        console.error(`Erro ao adicionar condomínio ${condominium.name}:`, error);
      }
    }
  }
}
