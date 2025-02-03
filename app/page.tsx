"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import KeywordReviewer from "./components/KeywordReviewer"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [spendThreshold, setSpendThreshold] = useState<number>(0)
  const [cpcThreshold, setCpcThreshold] = useState<number>(0)
  const [isReviewing, setIsReviewing] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        // Parse CSV data into an array and save it to state
        const rows = (text as string).split('\n').map(row => row.split(','))
        setCsvData(rows)
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (file && spendThreshold > 0 && cpcThreshold > 0) {
      setIsReviewing(true)
    } else {
      alert("Please fill in all fields")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Google Ads Keyword Reviewer</h1>
      {!isReviewing ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Search Terms Report</CardTitle>
            <CardDescription>Provide your CSV file and threshold values</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="file">CSV File</Label>
                <Input id="file" type="file" accept=".csv" onChange={handleFileChange} />
              </div>
              <div>
                <Label htmlFor="spend">Spend Threshold ($)</Label>
                <Input
                  id="spend"
                  type="number"
                  value={spendThreshold}
                  onChange={(e) => setSpendThreshold(Number(e.target.value))}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="cpc">Cost Per Conversion Threshold ($)</Label>
                <Input
                  id="cpc"
                  type="number"
                  value={cpcThreshold}
                  onChange={(e) => setCpcThreshold(Number(e.target.value))}
                  min="0"
                  step="0.1"
                />
              </div>
              <Button type="submit">Start Review</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <KeywordReviewer
          file={file!}
          spendThreshold={spendThreshold}
          cpcThreshold={cpcThreshold}
          onComplete={() => setIsReviewing(false)}
        />
      )}
    </div>
  )
}