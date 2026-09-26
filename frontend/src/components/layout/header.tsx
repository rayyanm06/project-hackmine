import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-14',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed
          ? 'border-b border-border/60 bg-background/95 backdrop-blur-md'
          : 'border-b border-transparent',
        'transition-[border-color,background-color] duration-200',
        className
      )}
      {...props}
    >
      <div className='relative flex h-full items-center gap-3 px-5 sm:gap-4'>
        <SidebarTrigger
          variant='ghost'
          className='max-md:scale-110 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
        />
        <Separator orientation='vertical' className='h-5 opacity-50' />
        {children}
      </div>
    </header>
  )
}
