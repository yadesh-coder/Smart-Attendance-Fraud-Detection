package com.smartattendance.device.dto;

public class DeviceSignalDto {

    private String userAgent;
    private String platform;
    private String language;
    private String screenDimensions;
    private String timezone;
    private String hardwareConcurrency;
    private String deviceMemory;
    private String touchSupport;
    private String deviceLabel;

    public DeviceSignalDto() {}

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getScreenDimensions() {
        return screenDimensions;
    }

    public void setScreenDimensions(String screenDimensions) {
        this.screenDimensions = screenDimensions;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getHardwareConcurrency() {
        return hardwareConcurrency;
    }

    public void setHardwareConcurrency(String hardwareConcurrency) {
        this.hardwareConcurrency = hardwareConcurrency;
    }

    public String getDeviceMemory() {
        return deviceMemory;
    }

    public void setDeviceMemory(String deviceMemory) {
        this.deviceMemory = deviceMemory;
    }

    public String getTouchSupport() {
        return touchSupport;
    }

    public void setTouchSupport(String touchSupport) {
        this.touchSupport = touchSupport;
    }

    public String getDeviceLabel() {
        return deviceLabel;
    }

    public void setDeviceLabel(String deviceLabel) {
        this.deviceLabel = deviceLabel;
    }
}
