CREATE DATABASE ARCHER;

USE ARCHER;

CREATE TABLE ARCHER_PremiumPayments (
    ID INT IDENTITY(1,1) NOT NULL,
    PolicyNumber VARCHAR(20) NOT NULL,
    PaymentCode INT NOT NULL,
    SuspenseAmount DECIMAL(20,2),
    PaymentAmount DECIMAL(20,2),
    CurrPaidToDate INT,
    NewPaidToDate INT,
    PaymentStatus INT NOT NULL,
    PaymentDate DATETIME,
    PRIMARY KEY (ID)
);

CREATE TABLE ARCHER_LoanPayments (
    ID INT IDENTITY(1,1) NOT NULL,
    PolicyNumber VARCHAR(20) NOT NULL,
    PaymentCode INT NOT NULL,
    SuspenseAmount DECIMAL(20,2),
    PaymentAmount DECIMAL(20,2),
    PriorLoanBalance DECIMAL(20,2),
    NewLoanBalance DECIMAL(20,2),
    PaymentStatus INT NOT NULL,
    PaymentDate DATETIME,
    PRIMARY KEY (ID)
);
