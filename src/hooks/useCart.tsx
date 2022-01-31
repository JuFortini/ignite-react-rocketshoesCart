import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  

  const addProduct = async (productId: number) => {

    try {

      const auxiliarCart = [...cart];
      const isProductInCart = auxiliarCart.find(product => product.id === productId);

      const productInStock = await api.get(`stock/${productId}`);
      const amountInStock = productInStock.data.amount;

      const currentAmount = isProductInCart ? isProductInCart.amount : 0;
      const amount = currentAmount + 1;

      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;

      } else {
        if (isProductInCart) {
          isProductInCart.amount = amount;

        } else {
          const getProduct = await api.get(`products/${productId}`);
          const cartUpdate = {
            ...getProduct.data,
            amount: 1
          };
          
          auxiliarCart.push(cartUpdate);
        }

        setCart(auxiliarCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(auxiliarCart));
      }
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const auxiliarCart = [...cart];
      const productExists = auxiliarCart.find(product => product.id === productId);

      if (productExists) {
        const position = auxiliarCart.indexOf(productExists);
        auxiliarCart.splice(position, 1);

        setCart(auxiliarCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(auxiliarCart));

      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const auxiliarCart = [...cart];
      const productExists = auxiliarCart.find(product => product.id === productId);

      const stock = await api.get(`stock/${productId}`);
      const amountInStock = stock.data.amount;

      if (amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;

      } else {
        if (productExists && amount >= 1) {
          const productToUpdate = auxiliarCart.filter(product => product.id === productId
            ? product.amount = amount
            : product.amount);
          
          setCart(productToUpdate);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(productToUpdate));
        }
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
