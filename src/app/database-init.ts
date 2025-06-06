import { UserService } from './core/services/user.service';
import { firstValueFrom } from 'rxjs';

export async function initializeDatabase(userService: UserService) {
  const initialUsers = [
    {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      role: 'Admin' as const,
      status: 'Active' as const,
      lastAccess: new Date(2025, 4, 27, 14, 30),
      initials: 'JS',
      avatarColor: '#7c3aed'
    },
    {
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      role: 'Manager' as const,
      status: 'Active' as const,
      lastAccess: new Date(2025, 4, 26, 10, 15),
      initials: 'MS',
      avatarColor: '#2563eb'
    },
    {
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@example.com',
      role: 'Reader' as const,
      status: 'Active' as const,
      lastAccess: new Date(2025, 4, 25, 16, 45),
      initials: 'CO',
      avatarColor: '#0891b2'
    }
  ];

  for (const user of initialUsers) {
    try {
      await firstValueFrom(userService.addUser(user));
      console.log(`Usuário ${user.name} adicionado com sucesso.`);
    } catch (error) {
      console.error(`Erro ao adicionar usuário ${user.name}:`, error);
    }
  }
}
