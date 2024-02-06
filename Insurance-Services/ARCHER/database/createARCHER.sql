--//Note: This uses the EIN Database currently, so this script is subject to change if used long-term.


USE DevData;
go
 
 
CREATE TABLE Archer (
			ID INT IDENTITY(1,1) NOT NULL
		,	LogDate DATETIME
		,	PolicyNumber VARCHAR(20) NOT NULL
		,	PaymentCode INT NOT NULL
		,	SuspenseAmount DECIMAL(20,2)
		,	PaymentAmount DECIMAL(20,2)
		,	Paid_to_date INT
		,	NewPaid_to_date INT
		,	PaymentStatus VARCHAR(10) NOT NULL
		,	PaymentDate INT NOT NULL
		,	PriorLoanBalance DECIMAL(20,2)
		,	NewLoanBalance DECIMAL(20,2)
		, 	LIPASResponse VARCHAR(MAX)
		PRIMARY KEY (ID)
		)