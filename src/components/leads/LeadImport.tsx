'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react'

interface LeadImportProps {
  onImported: () => void
}

const HEADERS = [
  'client_name',
  'phone',
  'email',
  'source',
  'destination',
  'travel_date_from',
  'travel_date_to',
  'adults',
  'children',
  'budget',
  'temperature',
  'status',
  'follow_up_date',
  'dmc',
  'dmc_custom',
  'notes',
  'serial_number',
  'region',
]

const HEADER_ALIASES: Record<string, string> = {
  name: 'client_name',
  client: 'client_name',
  client_name: 'client_name',
  customer_name: 'client_name',

  phone: 'phone',
  mobile: 'phone',
  mobile_number: 'phone',

  email: 'email',
  destination: 'destination',

  travel_date_from: 'travel_date_from',
  travel_from: 'travel_date_from',
  start_date: 'travel_date_from',

  travel_date_to: 'travel_date_to',
  travel_to: 'travel_date_to',
  end_date: 'travel_date_to',

  adults: 'adults',
  adult: 'adults',
  children: 'children',
  child: 'children',

  budget: 'budget',
  source: 'source',
  temperature: 'temperature',
  status: 'status',

  follow_up_date: 'follow_up_date',
  followup_date: 'follow_up_date',

  dmc: 'dmc',
  dmc_custom: 'dmc_custom',
  notes: 'notes',
  serial_number: 'serial_number',
  region: 'region',
}

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
}

function normalizeDate(value: unknown) {
  if (!value) return ''

  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  return String(value).trim()
}

function parseRows(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = event.target?.result

        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
        })

        const sheet = workbook.Sheets[
          workbook.SheetNames[0]
        ]

        const rawRows =
          XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            { defval: '' }
          )

        const rows = rawRows.map((raw) => {
          const row: Record<string, unknown> = {}

          for (const [key, value] of Object.entries(raw)) {
            const normalized = normalizeHeader(key)
            const target =
              HEADER_ALIASES[normalized] || normalized

            if (HEADERS.includes(target)) {
              row[target] =
                target.includes('date')
                  ? normalizeDate(value)
                  : value
            }
          }

          return row
        })

        resolve(rows)
      } catch {
        reject(new Error('Could not read the spreadsheet.'))
      }
    }

    reader.onerror = () =>
      reject(new Error('Could not read the file.'))

    reader.readAsArrayBuffer(file)
  })
}

function downloadTemplate() {
  const workbook = XLSX.utils.book_new()

  const sheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    [
      'Rahul Sharma',
      '9876543210',
      'rahul@example.com',
      'whatsapp',
      'Bali',
      '2026-12-10',
      '2026-12-15',
      '2',
      '0',
      '50k_1l',
      'hot',
      'new',
      '2026-10-20',
      'Baligo',
      '',
      'Interested in Bali package',
      '',
      '',
    ],
  ])

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    'Leads'
  )

  XLSX.writeFile(
    workbook,
    'tentwood-leads-template.xlsx'
  )
}

export default function LeadImport({
  onImported,
}: LeadImportProps) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<
    Record<string, unknown>[]
  >([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)

  function close() {
    if (importing) return

    setOpen(false)
    setRows([])
    setFileName('')
    setError('')
  }

  async function handleFile(file: File) {
    setError('')

    const valid =
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls') ||
      file.name.toLowerCase().endsWith('.csv')

    if (!valid) {
      setError(
        'Please select an Excel (.xlsx/.xls) or CSV file.'
      )
      return
    }

    try {
      const parsed = await parseRows(file)

      if (!parsed.length) {
        setError('The selected file contains no data.')
        return
      }

      if (parsed.length > 500) {
        setError('Maximum 500 leads per import.')
        return
      }

      setRows(parsed)
      setFileName(file.name)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not read the file.'
      )
    }
  }

  async function importLeads() {
    setError('')
    setImporting(true)

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors?.length) {
          setError(
            result.errors
              .slice(0, 5)
              .map(
                (item: { row: number; message: string }) =>
                  `Row ${item.row}: ${item.message}`
              )
              .join(' ')
          )
        } else {
          setError(
            result.error || 'Import failed.'
          )
        }

        return
      }

      close()
      onImported()
    } catch {
      setError(
        'Could not connect to the server.'
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          backgroundColor: '#fff',
          border: '1px solid #e7e5e4',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#44403c',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        <Upload size={15} />
        Import
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor:
              'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '16px',
              border: '1px solid #e7e5e4',
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                padding: '20px 22px',
                borderBottom:
                  '1px solid #f5f5f4',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1c1917',
                  }}
                >
                  Import Leads
                </h2>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#78716c',
                    marginTop: '3px',
                  }}
                >
                  Upload an Excel or CSV file.
                </p>
              </div>

              <button
                onClick={close}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              {!rows.length ? (
                <>
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '180px',
                      border:
                        '1px dashed #d6d3d1',
                      borderRadius: '12px',
                      backgroundColor:
                        '#fafaf9',
                      cursor: 'pointer',
                    }}
                  >
                    <FileSpreadsheet
                      size={30}
                      color="#78716c"
                    />

                    <span
                      style={{
                        marginTop: '10px',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Choose spreadsheet
                    </span>

                    <span
                      style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        color: '#a8a29e',
                      }}
                    >
                      XLSX, XLS or CSV · Max 500 rows
                    </span>

                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      hidden
                      onChange={(e) => {
                        const file =
                          e.target.files?.[0]

                        if (file) {
                          handleFile(file)
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={downloadTemplate}
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      border: 'none',
                      background: 'none',
                      color: '#57534e',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} />
                    Download Excel template
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      backgroundColor: '#f0fdf4',
                      border:
                        '1px solid #bbf7d0',
                      borderRadius: '10px',
                    }}
                  >
                    <CheckCircle2
                      size={18}
                      color="#15803d"
                    />

                    <div>
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {fileName}
                      </p>

                      <p
                        style={{
                          fontSize: '12px',
                          color: '#78716c',
                        }}
                      >
                        {rows.length} rows ready
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      border:
                        '1px solid #e7e5e4',
                      borderRadius: '10px',
                      overflow: 'auto',
                      maxHeight: '280px',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse:
                          'collapse',
                        fontSize: '12px',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor:
                              '#fafaf9',
                          }}
                        >
                          <th
                            style={{
                              padding: '9px',
                              textAlign: 'left',
                            }}
                          >
                            #
                          </th>

                          <th
                            style={{
                              padding: '9px',
                              textAlign: 'left',
                            }}
                          >
                            Name
                          </th>

                          <th
                            style={{
                              padding: '9px',
                              textAlign: 'left',
                            }}
                          >
                            Phone
                          </th>

                          <th
                            style={{
                              padding: '9px',
                              textAlign: 'left',
                            }}
                          >
                            Destination
                          </th>

                          <th
                            style={{
                              padding: '9px',
                              textAlign: 'left',
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows
                          .slice(0, 50)
                          .map((row, index) => (
                            <tr
                              key={index}
                              style={{
                                borderTop:
                                  '1px solid #f5f5f4',
                              }}
                            >
                              <td
                                style={{
                                  padding: '9px',
                                }}
                              >
                                {index + 1}
                              </td>

                              <td
                                style={{
                                  padding: '9px',
                                }}
                              >
                                {String(
                                  row.client_name ||
                                    ''
                                )}
                              </td>

                              <td
                                style={{
                                  padding: '9px',
                                }}
                              >
                                {String(
                                  row.phone || ''
                                )}
                              </td>

                              <td
                                style={{
                                  padding: '9px',
                                }}
                              >
                                {String(
                                  row.destination ||
                                    ''
                                )}
                              </td>

                              <td
                                style={{
                                  padding: '9px',
                                }}
                              >
                                {String(
                                  row.status ||
                                    'new'
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {rows.length > 50 && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#a8a29e',
                        marginTop: '8px',
                      }}
                    >
                      Showing first 50 rows of{' '}
                      {rows.length}.
                    </p>
                  )}
                </>
              )}

              {error && (
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    border:
                      '1px solid #fecaca',
                    borderRadius: '9px',
                    color: '#991b1b',
                    fontSize: '13px',
                  }}
                >
                  <AlertCircle
                    size={17}
                    style={{
                      flexShrink: 0,
                    }}
                  />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '16px 22px',
                borderTop:
                  '1px solid #f5f5f4',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                onClick={close}
                disabled={importing}
                style={{
                  padding: '9px 16px',
                  border:
                    '1px solid #d6d3d1',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              {rows.length > 0 && (
                <button
                  onClick={importLeads}
                  disabled={importing}
                  style={{
                    padding: '9px 18px',
                    border: 'none',
                    backgroundColor:
                      '#0D9488',
                    color: '#fff',
                    borderRadius: '8px',
                    cursor: importing
                      ? 'wait'
                      : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {importing
                    ? 'Importing...'
                    : `Import ${rows.length} Leads`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}