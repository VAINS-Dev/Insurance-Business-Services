use VA_CONV1_WORKFLOW;
GO

use insentry;
go

create procedure getCriticalWorkflowActions
as
begin



select FK_POLICIESPOL_ID AS POLICY_NUMBER, ACTION_OTHER, CREATED_TIMESTAMP from [VA_CONV1_WORKFLOW].dbo.WORKFLOW_ITEM fk

WHERE STATUS=1 AND FK_WORKFLOW_ITEM_TYPE=74
	and FK_POLICIESPOL_ID NOT IN 
		(SELECT POLICY_NUMBER from [LIFEPRO_CONV1].DBO.PPRMP_POLICY_PARAMETER_NAMES p
			where fk.FK_POLICIESPOL_ID = p.POLICY_NUMBER and PARM_DEFINITION_ID = 82
		)

end

exec getCriticalWorkflowActions