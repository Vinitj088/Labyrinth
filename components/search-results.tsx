'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchResultItem } from '@/lib/types'
import Link from 'next/link'
import { useState } from 'react'

export interface SearchResultsProps {
  results: SearchResultItem[]
}

export function SearchResults({ results }: SearchResultsProps) {
  // State to manage whether to display the results
  const [showAllResults, setShowAllResults] = useState(false)

  const handleViewMore = () => {
    setShowAllResults(true)
  }

  const displayedResults = showAllResults ? results : results.slice(0, 3)
  const additionalResultsCount = results.length > 3 ? results.length - 3 : 0

  const displayUrlName = (url: string) => {
    try {
      if (url === '#') return 'No URL';
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0];
    } catch (e) {
      console.warn('Invalid URL:', url);
      return 'Invalid URL';
    }
  }

  const getFaviconUrl = (url: string) => {
    try {
      if (url === '#') return '';
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}`;
    } catch (e) {
      console.warn('Invalid URL for favicon:', url);
      return '';
    }
  }

  const getFaviconFallback = (url: string) => {
    try {
      if (url === '#') return 'N';
      const hostname = new URL(url).hostname;
      return hostname[0].toUpperCase();
    } catch (e) {
      return 'U';
    }
  }

  return (
    <div className="flex flex-wrap">
      {displayedResults.map((result, index) => (
        <div className="w-1/2 md:w-1/4 p-1" key={index}>
          <Link 
            href={result.url} 
            passHref 
            target={result.url === '#' ? '_self' : '_blank'}
            className="block h-full"
          >
            <Card className="flex-1 h-full hover:bg-accent/50 transition-colors">
              <CardContent className="p-2 flex flex-col justify-between h-full">
                <p className="text-xs line-clamp-2 min-h-[2rem]">
                  {result.title || result.content}
                </p>
                <div className="mt-2 flex items-center space-x-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={getFaviconUrl(result.url)}
                      alt={displayUrlName(result.url)}
                    />
                    <AvatarFallback>
                      {getFaviconFallback(result.url)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs opacity-60 truncate">
                    {`${displayUrlName(result.url)}${index > 0 ? ` - ${index + 1}` : ''}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ))}
      
      {!showAllResults && additionalResultsCount > 0 && (
        <div className="w-1/2 md:w-1/4 p-1">
          <Card className="flex-1 h-full hover:bg-accent/50 transition-colors cursor-pointer" onClick={handleViewMore}>
            <CardContent className="p-2 h-full flex items-center justify-center">
              <Button
                variant="link"
                className="text-muted-foreground"
              >
                View {additionalResultsCount} more
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
