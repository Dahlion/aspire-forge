<#import "footer.ftl" as pageFooter>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width,initial-scale=1"/>

    <title>${msg("loginTitle",(realm.displayName!''))}</title>

    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>

    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>

    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!} sd-page-body">
    <div class="sd-security-banner" role="note" aria-label="Security classification banner">
        CUI
    </div>

    <div class="sd-page-shell">
        <main class="sd-main" role="main">
            <div class="sd-login-container">

                <div class="sd-layout-header">
                    <#nested "header">
                </div>

                <div class="sd-layout-form">
                    <#if displayMessage && message?has_content>
                        <div class="sd-global-message <#if message.type = 'error'>sd-global-message-error<#else>sd-global-message-${message.type}</#if>">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <#nested "form">
                </div>

                <#if displayInfo>
                    <div class="sd-layout-info">
                        <#nested "info">
                    </div>
                </#if>

            </div>
        </main>

    <footer class="sd-page-footer">
        <@pageFooter.content />
    </footer>
    
    </div>        

</body>    



</html>
</#macro>