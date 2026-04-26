import { fetchApi } from './api';

export interface Client {
  _id: string;
  clientId: string;
  name: string;
  phone?: string;
  unitId?: string;
  totalPurchases?: number;
  totalPaid?: number;
  balance?: number;
}

export interface ClientStatement {
  client: Client;
  statement: {
    _id: string;
    date: string;
    type: string;
    total: number;
    paid: number;
    balance: number;
    items: string;
  }[];
  summary: {
    totalPurchases: number;
    totalPaid: number;
    balance: number;
  };
}

export const clientsService = {
  async getAll(unitId?: string): Promise<Client[]> {
    const url = unitId ? `/clients?unitId=${unitId}` : '/clients';
    return fetchApi<Client[]>(url);
  },

  async getOne(id: string): Promise<Client> {
    return fetchApi<Client>(`/clients/${id}`);
  },

  async getStatement(id: string): Promise<ClientStatement> {
    return fetchApi<ClientStatement>(`/clients/${id}/statement`);
  },

  async create(data: Partial<Client>): Promise<Client> {
    return fetchApi<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    return fetchApi<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchApi(`/clients/${id}`, {
      method: 'DELETE',
    });
  },
  
  async recordPayment(clientId: string, amount: number, customerName?: string): Promise<any> {
    return fetchApi('/transactions/payment', {
      method: 'POST',
      body: JSON.stringify({ clientId, amount, customerName }),
    });
  },
};
