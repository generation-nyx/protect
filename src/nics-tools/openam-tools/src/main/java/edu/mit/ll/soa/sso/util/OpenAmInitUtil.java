/*
 * Copyright (c) 2008-2021, Massachusetts Institute of Technology (MIT)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package edu.mit.ll.soa.sso.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Created with IntelliJ IDEA. User: cbudny Date: 7/22/14 Time: 7:28 AM To change this template use File | Settings |
 * File Templates.
 */
public final class OpenAmInitUtil {
    /**
     * Generates the map required to initialize OpenAmUtils
     *
     * @param protocol protocol of identity server: http or https
     * @param host     server FQDN: identity.sample.com
     * @param port     port to access OpenAM: 80, 8080
     * @param path     openam deployment path: openam, tomcat/openam
     * @return map of initialization values
     */
    public static Map<String, String> createPropertiesMap(String protocol, String host, String port, String path) {
        Map<String, String> map = new HashMap<String, String>();
        map.put(OpenAmUtilConstants.IDP_HOST, host.toLowerCase());
        map.put(OpenAmUtilConstants.IDP_PROTOCOL, protocol.toLowerCase());
        map.put(OpenAmUtilConstants.IDP_PORT, port);
        map.put(OpenAmUtilConstants.IDP_PATH, path);

        return map;
    }

    public static Map<String, String> createPropertiesMap(String protocol, String host, String port,
                                                          String path, String user, String pass) {
        Map<String, String> map = OpenAmInitUtil.createPropertiesMap(protocol, host, port, path);

        map.put(OpenAmUtilConstants.CREATOR_USER, user);
        map.put(OpenAmUtilConstants.CREATOR_PASS, pass);

        return map;
    }

}
