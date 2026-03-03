'use client'

import {  ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { blockCard } from '@/app/dashboard/cards/actions'

interface CardProps {
    id: string;
    card_number: string;
    expiry_date: string;
    cvv: string;
    is_active: boolean;
    daily_limit: number;
}

export function CardDisplay({ card }: { card: CardProps }) {
  if (!card) return null

  const formatCardNumber = (num?: string | null) => {
    if (!num || typeof num !== 'string') return '**** **** **** ****'
    
    // Jinak provedeme klasický formát
    return num.match(/.{1,4}/g)?.join(' ') || num
  }
  const handleBlock = async () => {
    if (!confirm('Opravdu chcete trvale zablokovat tuto kartu?')) return
    
    const result = await blockCard(card.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Karta byla úspěšně zablokována.')
    }
  }

  return (
    <div className={`relative p-6 rounded-xl shadow-lg border w-full max-w-90 overflow-hidden transition-opacity ${!card.is_active ? 'opacity-50 grayscale' : 'bg-linear-to-tr from-slate-900 to-slate-700 text-white'}`}>
      
      {/* Vizuální efekt čipu a loga */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex justify-center items-center bg-amber-200/80 opacity-80 border border-amber-400/50 rounded w-12 h-8">
          <div className="border border-amber-600/30 rounded-sm w-6 h-4"></div>
        </div>
        <div className="font-bold text-slate-300 italic">Prime Pay</div>
      </div>

      {/* Číslo karty (teď už 100% bezpečně) */}
      <div className="mb-4 font-mono text-xl tracking-widest">
        {formatCardNumber(card.card_number)}
      </div>

      {/* Spodní řádek: Expirace a CVV */}
      <div className="flex justify-between font-mono text-slate-300 text-sm">
        <div>
          <span className="block mb-1 text-[10px] uppercase">Valid Thru</span>
          {/* Tady také přidáme záchranu, kdyby v DB byl null */}
          {card.expiry_date || '**/**'}
        </div>
        <div>
          <span className="block mb-1 text-[10px] uppercase">CVV</span>
          {/* A tady také */}
          {card.cvv || '***'}
        </div>
      </div>

      {/* Akce pod kartou (zobrazíme, pokud není zablokovaná) */}
      {card.is_active && (
        <div className="absolute inset-0 flex justify-center items-center bg-black/60 opacity-0 hover:opacity-100 backdrop-blur-sm transition-opacity">
          <Button variant="destructive" size="sm" onClick={handleBlock} className='cursor-pointer'>
            <ShieldAlert className="mr-2 size-4" />
            Zablokovat kartu
          </Button>
        </div>
      )}
      
      {!card.is_active && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="bg-red-600 px-4 py-1 border-2 border-red-200 rounded font-bold text-white rotate-12">
            ZABLOKOVÁNA
          </div>
        </div>
      )}
    </div>
  )
}
