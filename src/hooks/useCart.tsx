import { createContext, ReactNode, useContext, useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.findIndex(prod => prod.id === productId)

      if(productInCart !== -1) {
        const newCart = [...cart]

        const stockData = await api.get(`/stock/${productId}`)
        const stock = stockData.data as Stock

        if(cart[productInCart].amount >= stock.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        newCart[productInCart].amount += 1
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        const productData = await api.get(`/products/${productId}`)
        const productFotmatted = productData.data

        const newCart = [...cart, {...productFotmatted, amount: 1}]
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.findIndex(product => product.id === productId)

      if (productInCart === -1) {
        toast.error('Erro na remoção do produto')
        return
      }

      const updatedCart = cart.filter(product => product.id !== productId)
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }

      const productInCart = cart.findIndex(prod => prod.id === productId)

      if(productInCart === -1) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }

      const stockData = await api.get(`/stock/${productId}`)
      const stock = stockData.data as Stock

      const productIsUnavailable = amount > stock.amount

      if(productIsUnavailable) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const updatedCart = [...cart]
      updatedCart[productInCart].amount = amount

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
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


