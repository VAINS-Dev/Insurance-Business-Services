--///Find Policies and format to acceptable JSON format.
--///
--/// USE: ARCHER Premium Automation System
--/// This script is designed to find policies where a loan does not exist and the amount in suspense is greater than the MODE_PREMIUM    
USE LIFEPRO;
GO
SELECT DISTINCT 
	  PS.AMOUNT 
    , PP.POLICY_NUMBER
    , PP.PAID_TO_DATE
    , SUBSTRING(CAST(PP.PAID_TO_DATE AS VARCHAR), 1,4) AS TAX_YEAR

    FROM PPOLC PP
	JOIN PPBEN_POLICY_BENEFITS					AS		pb		ON		pp.Policy_Number=pb.Policy_Number
	JOIN PPBEN_POLICY_BENEFITS_TYPES_BA_OR		AS		pbt		ON		pb.PBEN_ID=pbt.PBEN_ID
																			AND pb.BENEFIT_TYPE='BA'
	JOIN PPBEN_POLICY_BENEFITS					AS		be		ON		pp.Policy_Number=be.Policy_Number
	INNER JOIN PRELA_RELATIONSHIP_MASTER		AS		R		ON		SUBSTRING(R.IDENTIFYING_ALPHA,1,2) = pp.COMPANY_CODE 
																			AND SUBSTRING(R.IDENTIFYING_ALPHA,3,12)=PP.POLICY_NUMBER 
																			AND R.RELATE_CODE = 'IN'											
    JOIN PSUSP_SUSPENSE_MASTER                  AS      PS      ON      PS.SUSP_NUMBER = PP.POLICY_NUMBER
    JOIN PLOAN_LOAN_MASTER PL ON PL.POLICY_NUMBER = A.POLICY_NUMBER
        
        WHERE N.DEATH_DATE = '' AND DECEASED_FLAG <> 'Y'
        AND PS.AMOUNT >= PP.MODE_PREMIUM
		AND PP.CONTRACT_CODE='A'
            AND PL.STATUS_CODE<> 'A'
            AND PL.LOAN_BALANCE =0.00
