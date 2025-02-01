"use client"

import { useState, useEffect, useCallback } from "react"
import { parse } from "csv-parse/browser/esm/sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [negativeKeywords, setNegativeKeywords] = useState<string[]>([])

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const records = parse(text, { columns: true, skip_empty_lines: true })
      const filteredKeywords = records
        .map((record: any) => ({
          keyword: record["Search term"],
          spend: Number.parseFloat(record["Cost"]),
          impressions: Number.parseInt(record["Impressions"], 10),
          clicks: Number.parseInt(record["Clicks"], 10),
          costPerConversion: Number.parseFloat(record["Cost / conv."]),
        }))
        .filter((keyword: Keyword) => keyword.spend >= spendThreshold && keyword.costPerConversion >= cpcThreshold)
      setKeywords(filteredKeywords)
    }
    reader.readAsText(file)
  }, [file, spendThreshold, cpcThreshold])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "y" || event.key === "Y") {
        setNegativeKeywords((prev) => [...prev, keywords[currentIndex].keyword])
        setCurrentIndex((prev) => prev + 1)
      } else if (event.key === "n" || event.key === "N") {
        setCurrentIndex((prev) => prev + 1)
      }
    },
    [currentIndex, keywords],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [handleKeyPress])

  if (currentIndex >= keywords.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Complete</CardTitle>
          <CardDescription>Here are the keywords to add as exact match negatives:</CardDescription>
        </CardHeader>
        <CardContent>
          <ul>
            {negativeKeywords.map((keyword, index) => (
              <li key={index}>{keyword}</li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={onComplete}>Start Over</Button>
        </CardFooter>
      </Card>
    )
  }

  const currentKeyword = keywords[currentIndex]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Keyword</CardTitle>
        <CardDescription>Press 'Y' to add as negative, 'N' to skip</CardDescription>
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
        <Button onClick={() => handleKeyPress({ key: "n" } as KeyboardEvent)}>Skip (N)</Button>
        <Button onClick={() => handleKeyPress({ key: "y" } as KeyboardEvent)}>Add as Negative (Y)</Button>
      </CardFooter>
    </Card>
  )
}