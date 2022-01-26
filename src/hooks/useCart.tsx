import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);

  useEffect(() => {
    async function getProducts() {

      const response = await api.get("products")
       .then(response => response.data);

      async function addAmount(response: Product[]) {

        const productAmount = response.map(product => [product, product.amount = 1]);
        return {
          productAmount
        }
      }

      await addAmount(response)

      setProducts(response);
      
    }

    getProducts();

    async function getStock() {
      
      const stockAmount = await api.get("stock")
        .then(response => response.data);

      setStock(stockAmount);
    }

    getStock();
    
  }, []);  

  const addProduct = async (productId: number) => {

    try {

      if (products.find(product => product.id === productId)) {
        
        const isProductInCart = cart.filter(product => product.id === productId);
  
        if (isProductInCart.length === 0) {
  
          const getProduct = products.filter(product => product.id === productId);
          
          setCart([...cart, getProduct[0]]);
  
        } else {
  
          const response = cart.filter(product => product.id === productId);
          const getAmount = response.map(prop => prop.amount);
          const amount = getAmount[0] + 1;
  
          await updateProductAmount({productId, amount});
        }

      } else {
        throw Error
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      if (cart.find(product => product.id === productId)) {

        const removedProduct = cart.filter(product => product.id !== productId);
        setCart(removedProduct); 

      } else {
        throw Error
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
      
      if (products.find(product => product.id === productId) && amount >= 1) {

        const amountInStock = stock.filter(product => product.id === productId);
        const isAmountEnough = amountInStock.map(prop => prop.amount);
        const stockAmount = isAmountEnough[0];
  
        if (amount <= stockAmount) {
          cart.filter(product => product.id === productId
            ? product.amount = amount
            : product.amount);
          
          setCart([...cart]);
  
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {
        throw Error
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

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
