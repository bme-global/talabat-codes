# Sending Coupons to Email List

This guide explains how to use the `send:coupons` script to send Talabat coupon codes to a list of email addresses from a CSV file.

## Prerequisites

Before running the script, ensure that:

1. You have installed all dependencies with `npm install`
2. You have set up your `.env` file with a valid `SENDGRID_API_KEY`
3. You have enough unused coupon codes in the database
4. You have created a CSV file with the email addresses

## CSV File Format

The CSV file should contain at least an `email` column. Optionally, you can include a `ticketNumber` column to associate the coupon code with a ticket.

Example CSV format:

```
email,ticketNumber
user1@example.com,TICKET123
user2@example.com,TICKET124
user3@example.com,
```

A sample CSV template is available at `data/emails.csv`.

## Running the Script

To send coupons to emails in a CSV file:

```bash
npm run send:coupons [path-to-csv-file] [emails-per-second]
```

Parameters:

- `[path-to-csv-file]`: Optional. Path to the CSV file containing email addresses. Default: `./data/emails.csv`
- `[emails-per-second]`: Optional. Number of emails to send per second. Default: `2`

Examples:

```bash
# Using default CSV file (./data/emails.csv) and default rate (2 emails/sec)
npm run send:coupons

# Using custom CSV file with default rate
npm run send:coupons ./my-email-list.csv

# Using custom CSV file and custom rate (5 emails/sec)
npm run send:coupons ./my-email-list.csv 5
```

## Progress Monitoring

The script displays a progress bar in the terminal showing:

- Percentage completed
- Number of emails processed
- Estimated time remaining

## Logs

All email sending operations are logged to `logs/email-sending.log`, including:

- Successful email deliveries
- Failed email deliveries with error details
- Timestamps

## Troubleshooting

If you encounter issues:

1. Check the log file at `logs/email-sending.log`
2. Ensure your Sendgrid API key is valid
3. Verify that you have enough unused codes in the database
4. Make sure your CSV file is properly formatted with an `email` column

For more help, contact the system administrator.
