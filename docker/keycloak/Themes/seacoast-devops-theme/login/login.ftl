<#import "template.ftl" as layout>

<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
        <div class="sd-header" role="banner">
            <img src="${url.resourcesPath}/img/seacoastlogo.png" alt="Seacoast DevOps" class="sd-logo" />
        </div>

    <#elseif section = "form">
        <div class="sd-login-card">
            <h2 class="sd-card-title">${msg("loginAccountTitle")}</h2>

            <form id="kc-form-login" action="${url.loginAction}" method="post">
                <div class="sd-field-group">
                    <label for="username" class="sd-label">
                        <#if !realm.loginWithEmailAllowed>
                            ${msg("username")}
                        <#elseif !realm.registrationEmailAsUsername>
                            ${msg("usernameOrEmail")}
                        <#else>
                            ${msg("email")}
                        </#if>
                    </label>

                    <input
                        tabindex="1"
                        id="username"
                        class="sd-input"
                        name="username"
                        value="${(login.username!'')}"
                        type="text"
                        autofocus
                        autocomplete="username"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                    />
                </div>

                <div class="sd-field-group">
                    <label for="password" class="sd-label">${msg("password")}</label>
                    <input
                        tabindex="2"
                        id="password"
                        class="sd-input"
                        name="password"
                        type="password"
                        autocomplete="current-password"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                    />
                </div>

                <#if messagesPerField.existsError('username','password')>
                    <div class="sd-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                    </div>
                </#if>

                <div class="sd-options-row">
                    <#if realm.rememberMe && !usernameEditDisabled??>
                        <label class="sd-checkbox-wrap">
                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>>
                            <span>${msg("rememberMe")}</span>
                        </label>
                    </#if>

                    <#if realm.resetPasswordAllowed>
                        <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="sd-link">
                            ${msg("doForgotPassword")}
                        </a>
                    </#if>
                </div>

                <div class="sd-submit-row">
                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
                    <input tabindex="4" class="sd-button" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}" />
                </div>
            </form>

            <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
                <div class="sd-register-row">
                    <span>${msg("noAccount")}</span>
                    <a href="${url.registrationUrl}" class="sd-link">${msg("doRegister")}</a>
                </div>
            </#if>

            <#if social.providers?? && social.providers?has_content>
                <div class="sd-divider"><span>or continue with</span></div>
                <div class="sd-social-wrap">
                    <#list social.providers as p>
                        <a id="social-${p.alias}" class="sd-social-button" href="${p.loginUrl}">${p.displayName}</a>
                    </#list>
                </div>
            </#if>
        </div>

    <#elseif section = "info">
    </#if>

</@layout.registrationLayout>