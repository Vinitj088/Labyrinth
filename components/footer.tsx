
import Link from 'next/link'
import React from 'react'
import { SiGithub } from 'react-icons/si'
import { Button } from './ui/button'
const Footer: React.FC = () => {
  return (
    <footer className="w-fit p-1 md:p-2 fixed bottom-0 right-0 hidden lg:block">
      <div className="flex justify-end">
        {/* <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <Link href="https://discord.gg/zRxaseCuGq" target="_blank">
            <SiDiscord size={18} />
          </Link>
        </Button>
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <Link href="https://x.com" target="_blank">
            <SiX size={18} />
          </Link>
        </Button>*/}
        <Button
          variant={'ghost'}
          size={'icon'}
          className="text-muted-foreground/50"
        >
          <Link href="https://github.com/Vinitj088/Labyrinth" target="_blank">
            <SiGithub size={18} />
          </Link>
        </Button> 
      </div>
    </footer>
  )
}

export default Footer
