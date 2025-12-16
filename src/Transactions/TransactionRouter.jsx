import React, { Children } from 'react'
import Rate from './Rate'

const TransactionRouter  = {
  Path: 'Transactions',
  Children: [
    {path: 'Rate', element: <Rate/>}
  ]
}

export default TransactionRouter