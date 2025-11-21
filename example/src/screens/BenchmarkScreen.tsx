import React, { useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native'
import { open } from 'react-native-nitro-sqlite'

export const BenchmarkScreen = () => {
  const [logs, setLogs] = useState<string[]>([])

  // Helper to add messages to the screen
  const log = (msg: string) => setLogs((prev) => [...prev, msg])

  useEffect(() => {
    runVectorTest()
  }, [])

  const runVectorTest = () => {
    log('📂 Initializing Database...')

    try {
      const db = open({ name: 'vectors.sqlite' })

      // 1. Reset Table
      db.execute('DROP TABLE IF EXISTS memories')
      db.execute(
        `create virtual table memories using vec0(sample_embedding float[8])`,
      )
      log('✨ Created fresh "memories" table')

      // 2. Insert Meaningful Data (Orthogonal Vectors)
      // Vector A: "Red"-ish (High 1st dim)
      const vecRed = new Float32Array([1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
      // Vector B: "Green"-ish (High 2nd dim)
      const vecGreen = new Float32Array([0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
      // Vector C: "Blue"-ish (High 3rd dim)
      const vecBlue = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0])

      db.execute('INSERT INTO memories(sample_embedding) VALUES (?)', [vecRed.buffer])
      db.execute('INSERT INTO memories(sample_embedding) VALUES (?)', [vecGreen.buffer])
      db.execute('INSERT INTO memories(sample_embedding) VALUES (?)', [vecBlue.buffer])
      log('✅ Inserted 3 vectors: Red(1), Green(2), Blue(3)')

      // 3. Perform Similarity Search
      // Query: Mostly Red, a little Green ([0.9, 0.1, ...]) -> Should match Red(1) best
      const queryVector = new Float32Array([0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
      
      log('🔎 Querying for "Red-ish" vector [0.9, 0.1, 0...]')
      const results = db.execute(
        `SELECT rowid, distance FROM memories WHERE sample_embedding MATCH ? ORDER BY distance LIMIT 3`,
        [queryVector.buffer],
      )

      log(`� Results (Lower distance = better match):`)
      results.rows?._array.forEach((row: any) => {
        let label = 'Unknown'
        if (row.rowid === 1) label = 'Red'
        if (row.rowid === 2) label = 'Green'
        if (row.rowid === 3) label = 'Blue'
        log(`   ${label} (ID: ${row.rowid}): Distance ${row.distance.toFixed(4)}`)
      })

      // db.close(); // Optional
    } catch (e: any) {
      log(`❌ Error: ${e.message}`)
    }
  }

  return (
    <>
      <View style={{ backgroundColor: 'black', flex: 1 }}>
        {logs.map((msg, index) => (
          <Text
            key={index}
            style={styles.logText}
          >
            {msg}
          </Text>
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111', // Dark mode
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  logText: {
    color: '#0f0', // Matrix green
    fontFamily: 'Courier',
    marginBottom: 10,
    fontSize: 14,
  },
})
