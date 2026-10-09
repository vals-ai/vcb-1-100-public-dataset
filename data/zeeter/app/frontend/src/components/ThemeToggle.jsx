import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
export function ThemeToggle() { const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark'); useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark]); return <Button variant="ghost" size="icon" aria-label={dark ? 'Use light mode' : 'Use dark mode'} onClick={() => setDark((value) => !value)}>{dark ? <Sun className="size-5"/> : <Moon className="size-5"/>}</Button> }
