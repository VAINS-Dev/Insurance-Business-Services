CREATE DATABASE ARCHER;

USE ARCHER;

CREATE TABLE ARCHER.PremiumPayments (
    ID INT IDENTITY(1,1) NOT NULL,
    PolicyNumber VARCHAR(20) NOT NULL,
    PaymentCode INT(2) NOT NULL,
    SuspenseAmount DECIMAL(20,2),
    PaymentAmount DECIMAL(20,2),
    CurrPaidToDate INT(8),
    NewPaidToDate INT(8),
    PaymentStatus INT(2) NOT NULL,
    PaymentDate DATETIME,
    PRIMARY KEY (ID)
);

CREATE TABLE ARCHER.LoanPayments (
    ID INT IDENTITY(1,1) NOT NULL,
    PolicyNumber VARCHAR(20) NOT NULL,
    PaymentCode INT(2) NOT NULL,
    SuspenseAmount DECIMAL(20,2),
    PaymentAmount DECIMAL(20,2),
    PriorLoanBalance DECIMAL(20,2),
    NewLoanBalance DECIMAL(20,2),
    PaymentStatus INT(2) NOT NULL,
    PaymentDate DATETIME,
    PRIMARY KEY (ID)
);
