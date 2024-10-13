import React, { createContext, useState } from 'react';
import { supabase } from '../supabase';

interface WarrantyClaim {
  email: string;
  name: string;
  phoneNumber: string;
  orderNumber: string;
  returnAddress: string;
  brand: string;
  problem: string;
}

interface User {
  email: string;
  orderNumber?: string;
  isAdmin: boolean;
}

interface WarrantyContextType {
  submitClaim: (claim: WarrantyClaim) => Promise<string>;
  getBrandNotice: (brand: string) => string;
  login: (email: string, orderNumber: string) => Promise<void>;
  logout: () => void;
  user: User | null;
}

export const WarrantyContext = createContext<WarrantyContextType>({
  submitClaim: async () => '',
  getBrandNotice: () => '',
  login: async () => {},
  logout: () => {},
  user: null,
});

export const WarrantyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const submitClaim = async (claim: WarrantyClaim): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('warranty_claims')
        .insert([{ ...claim, status: 'Pending' }])
        .select();

      if (error) throw error;

      if (!data || data.length === 0) throw new Error('No data returned from insert');

      return data[0].id.toString();
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  };

  const getBrandNotice = (brand: string): string => {
    const notices: Record<string, string> = {
      Seiko: "Please note that water damage is not covered under Seiko's standard warranty.",
      Casio: "For G-Shock models, impact resistance is covered, but glass scratches are not.",
      Timex: "Timex offers a 1-year limited warranty from the original purchase date.",
    };
    return notices[brand] || '';
  };

  const login = async (email: string, orderNumber: string): Promise<void> => {
    try {
      if (email === 'admin@example.com' && orderNumber === 'admin123') {
        setUser({ email, isAdmin: true });
        return;
      }

      const { data, error } = await supabase
        .from('warranty_claims')
        .select('email, orderNumber')
        .eq('email', email)
        .eq('orderNumber', orderNumber)
        .single();

      if (error) throw error;

      if (data) {
        setUser({ email, orderNumber, isAdmin: false });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <WarrantyContext.Provider value={{ submitClaim, getBrandNotice, login, logout, user }}>
      {children}
    </WarrantyContext.Provider>
  );
};