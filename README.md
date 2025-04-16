# Talabat Codes

Talabat Codes is a server application designed to distribute voucher codes for the Talabat food delivery service in conjunction with the purchase of event tickets.

## How It Works

Here's a high-level overview of how it works:

1. **Voucher Code Distribution:** The application is an independent API that distributes voucher codes stored in a database. When the API is called, typically from an event ticketing system, it receives the email of the purchaser and the ticket number.
2. **Voucher Code Selection:** Upon receiving a request, the application selects the first unused code from the database.
3. **Voucher Code Delivery:** The selected voucher code is then sent to the provided email address.
4. **Database Update:** After the voucher code is sent, the application stores the ticket number in the database alongside the corresponding code. This marks the code as used and associates it with the ticket purchase.
5. **Logging:** The application maintains log files to track its operations and assist in troubleshooting and auditing. It logs information such as when and to whom codes are sent, and any errors that occur.

The application is built with Node.js and Express, and it uses Prisma for database management. It's designed to be deployed as a Docker container, which makes it easy to run on any platform that supports Docker.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- Docker

### Installing

1. Clone the repository:

```bash
git clone https://github.com/yourusername/talabat-codes.git
```

2\. Install the dependencies:

```bash
npm install
```

3\. Copy the `.env.example` file to `.env` and fill in your environment variables.

4\. Generate Prisma Client

```bash
npx prisma generate
```

5\. Build the project:

```bash
npm run build
```

### Running the application

To start the application in development mode, run:

```bash
npm run dev
```

To start the application in production mode, run:

```bash
npm run start
```

### Database

This project uses Prisma for database management.

To seed the database with voucher codes:

```bash
# Using default CSV file (./data/vouchers.csv)
npm run seed:db

# Or specify a custom CSV file
npm run seed:db ./path/to/your-codes.csv
```

To push the Prisma schema to the database, run:

```bash
npm run db:push
```

### Sending Coupons to Email Lists

To send coupon codes to a list of email addresses from a CSV file:

```bash
# Using default CSV file (./data/emails.csv)
npm run send:coupons

# Or specify a custom file and rate limit
npm run send:coupons ./path/to/your-emails.csv 5
```

For more details, see [Sending Coupons Documentation](docs/SENDING_COUPONS.md).

### Deployment

To deploy the application to a remote server, run:

```bash
npm run deploy
```

This will build a Docker image of the application and start it on the remote server.

## Built With

- [Node.js](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-sandbox/workbench/workbench.html)
- [Express](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-sandbox/workbench/workbench.html)
- [Prisma](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-sandbox/workbench/workbench.html)
- [SendGrid](vscode-file://vscode-app/Applications/Visual%20Studio%20Code.app/Contents/Resources/app/out/vs/code/electron-sandbox/workbench/workbench.html)

## License

This project is licensed under the ISC License.
