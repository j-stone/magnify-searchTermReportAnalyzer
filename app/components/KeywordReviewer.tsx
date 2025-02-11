"use client"

import { useState, useEffect, useCallback } from "react"
import { parse } from "csv-parse/browser/esm/sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Keyword {
  keyword: string
  spend: number
  impressions: number
  clicks: number
  costPerConversion: number
}

interface KeywordReviewerProps {
  file: File
  spendThreshold: number
  cpcThreshold: number
  onComplete: () => void
}

export default function KeywordReviewer({ file, spendThreshold, cpcThreshold, onComplete }: KeywordReviewerProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [negativeKeywords, setNegativeKeywords] = useState<Keyword[]>([])

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const records = parse(text, { columns: true, skip_empty_lines: true })
      const filteredKeywords = records
        .filter((record: any) => !record["Search term"].startsWith("Total:"))
        .filter((record: any) => record["Added/Excluded"] !== "Excluded")
        .map((record: any) => {
          const cost = Number.parseFloat(record["Cost"])
          const conversions = Number.parseFloat(record["Conversions"])
          const costPerConversion = conversions === 0 ? Infinity : cost / conversions
          
          return {
            keyword: record["Search term"],
            spend: cost,
            impressions: Number.parseInt(record["Impr."], 10),
            clicks: Number.parseInt(record["Clicks"], 10),
            costPerConversion,
          }
        })
        .filter((keyword: Keyword) => keyword.spend >= spendThreshold && keyword.costPerConversion >= cpcThreshold)
      setKeywords(filteredKeywords)
    }
    reader.readAsText(file)
  }, [file, spendThreshold, cpcThreshold])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'y' && currentIndex < keywords.length) {
      setNegativeKeywords([...negativeKeywords, {
        ...keywords[currentIndex],
        keyword: `[${keywords[currentIndex].keyword}]`
      }])
      setCurrentIndex(currentIndex + 1)
    } else if (event.key.toLowerCase() === 'n' && currentIndex < keywords.length) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  const handleExport = () => {
    // Create CSV content with just the keywords
    const csvContent = negativeKeywords
      .map(keyword => keyword.keyword)
      .join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'negative-keywords.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentIndex >= keywords.length) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Review Complete</CardTitle>
            <CardDescription>Here are the keywords to add as exact match negatives:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul>
              {negativeKeywords.map((keyword, index) => (
                <li key={index}>{keyword.keyword}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={onComplete}>Start Over</Button>
          </CardFooter>
        </Card>

        {negativeKeywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Negative Keywords</CardTitle>
              <CardDescription>
                {negativeKeywords.length} keywords selected for negative matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Cost Per Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {negativeKeywords.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell>{keyword.keyword}</TableCell>
                      <TableCell>${keyword.spend.toFixed(2)}</TableCell>
                      <TableCell>
                        {keyword.costPerConversion === Infinity 
                          ? "∞" 
                          : `$${keyword.costPerConversion.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <CardContent className="pt-6">
          <p className="mb-4">Review complete! {negativeKeywords.length} keywords selected.</p>
          <Button onClick={handleExport}>
            Export Negative Keywords
          </Button>
        </CardContent>
      </div>
    )
  }

  const currentKeyword = keywords[currentIndex]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Review Keyword</CardTitle>
          <CardDescription>
            Press 'Y' to add as negative, 'N' to skip
            <div className="mt-2">
              Progress: {currentIndex + 1} of {keywords.length} keywords ({Math.round((currentIndex / keywords.length) * 100)}%)
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Keyword:</strong> {currentKeyword.keyword}
          </p>
          <p>
            <strong>Spend:</strong> ${currentKeyword.spend.toFixed(2)}
          </p>
          <p>
            <strong>Impressions:</strong> {currentKeyword.impressions}
          </p>
          <p>
            <strong>Clicks:</strong> {currentKeyword.clicks}
          </p>
          <p>
            <strong>Cost Per Conversion:</strong> ${currentKeyword.costPerConversion.toFixed(2)}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => handleKeyDown({ key: "n" } as KeyboardEvent)}>Skip (N)</Button>
          <Button onClick={() => handleKeyDown({ key: "y" } as KeyboardEvent)}>Add as Negative (Y)</Button>
        </CardFooter>
      </Card>

      {negativeKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Negative Keywords</CardTitle>
            <CardDescription>
              {negativeKeywords.length} keywords selected for negative matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Cost Per Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negativeKeywords.map((keyword, index) => (
                  <TableRow key={index}>
                    <TableCell>{keyword.keyword}</TableCell>
                    <TableCell>${keyword.spend.toFixed(2)}</TableCell>
                    <TableCell>
                      {keyword.costPerConversion === Infinity 
                        ? "∞" 
                        : `$${keyword.costPerConversion.toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}