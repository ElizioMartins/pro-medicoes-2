
import { firstValueFrom } from 'rxjs';
import { UserService } from './core/services/user.service';
import { User, UserCreate } from './core/models/User';

export async function initializeDatabase(userService: UserService) {
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
