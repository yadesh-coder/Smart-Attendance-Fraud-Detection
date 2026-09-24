package com.smartattendance.fraud.dto;

public class TriggeredRuleDto {
    private String ruleCode;
    private String ruleDescription;
    private String severity;

    public TriggeredRuleDto() {
    }

    public TriggeredRuleDto(String ruleCode, String ruleDescription, String severity) {
        this.ruleCode = ruleCode;
        this.ruleDescription = ruleDescription;
        this.severity = severity;
    }

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    public String getRuleDescription() {
        return ruleDescription;
    }

    public void setRuleDescription(String ruleDescription) {
        this.ruleDescription = ruleDescription;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }
}
