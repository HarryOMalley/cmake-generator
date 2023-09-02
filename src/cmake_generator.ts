/**
 * @module cmake_generator
 * @description This module contains the logic to generate a CMakeLists.txt file
 */

import path = require("path");


export enum ILibraryType {
    STATIC = "STATIC",
    SHARED = "SHARED",
    INTERFACE = "INTERFACE"
}

export enum ISourceVisibility {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
    INTERFACE = "INTERFACE"
}

export enum ISourceType {
    REGULAR,  // Regular source files like .cpp, .c, etc.
    HEADER,   // Header files, primarily for C and C++.
    CXX_MODULE // Experimental C++ Modules, only if you wish to support them.
}

export type ISourceFile = {
    name: string;
    path: string;
};

export type ISources = {
    files: ISourceFile[];
    type: ISourceType;
    visibility: ISourceVisibility;
};

export type ILibrary = {
    name: string;
    type: ILibraryType;
    sources: ISources[];
};

export function createLibrary(library: ILibrary) {
    // Generate the CMake command to add a library
    let cmakeCommand = `add_library(${library.name} ${library.type})\n`;

    // Loop over each source group
    for (const sources of library.sources) {

        let sourceType: string = "";
        // Determine the type of the source group
        let groupType: ISourceType = sources.type;
        switch (groupType) {
            case ISourceType.REGULAR:
                sourceType = " "
                break;
            case ISourceType.HEADER:
                sourceType = `FILE_SET HEADERS FILES `;
                break;
            case ISourceType.CXX_MODULE:
                sourceType = `FILE_SET CXX_MODULES FILES `;
                break;
        }
        let targetSourcesCommand = `\ntarget_sources(${library.name} ${sources.visibility} ${sourceType}${sources.files.map((file) => file.path).join(" ")})`;

        cmakeCommand += targetSourcesCommand;
    }

    return cmakeCommand;
}




/**
 * 
 macro(create_library LIB_NAME)
    # Define options and defaults
    set(options
        SHARED
        STATIC
        INTERFACE
        INSTALL
    )
    set(oneValueArgs HEADER_LOCATION HEADER_INSTALL_LOCATION)
    set(multiValueArgs
        LINK_LIBRARIES_PUBLIC
        LINK_LIBRARIES_PRIVATE
        SOURCE_FILES
        INCLUDE_DIRECTORIES_PUBLIC
        INCLUDE_DIRECTORIES_PRIVATE
    )

    # Parse the arguments provided to the macro
    cmake_parse_arguments(
        LIB_ARG
        "${options}"
        "${oneValueArgs}"
        "${multiValueArgs}"
        ${ARGN}
    )

    # Set default header location if not provided
    if(NOT LIB_ARG_HEADER_LOCATION)
        set(LIB_ARG_HEADER_LOCATION "${CMAKE_CURRENT_SOURCE_DIR}/include")
    endif()

    # Set default header install location if not provided
    if(NOT LIB_ARG_HEADER_INSTALL_LOCATION)
        set(LIB_ARG_HEADER_INSTALL_LOCATION "include/${LIB_NAME}")
    endif()

    # Determine the type of the library (SHARED, STATIC, INTERFACE)
    set(LIB_TYPE)
    if(${LIB_ARG_SHARED})
        set(LIB_TYPE SHARED)
    elseif(${LIB_ARG_STATIC})
        set(LIB_TYPE STATIC)
    elseif(${LIB_ARG_INTERFACE})
        set(LIB_TYPE INTERFACE)
    else()
        message(FATAL_ERROR "Failed to create ${LIB_NAME}. You must specify a library type: SHARED, STATIC, or INTERFACE.")
    endif()

    # Create a library with the determined type
    add_library(${LIB_NAME} ${LIB_TYPE})

    # Configure the library based on its type
    if(${LIB_TYPE} STREQUAL "INTERFACE")
        target_include_directories(
            ${LIB_NAME}
            INTERFACE $<BUILD_INTERFACE:${LIB_ARG_HEADER_LOCATION}>
                      $<INSTALL_INTERFACE:${LIB_ARG_HEADER_INSTALL_LOCATION}>
        )

        if(LIB_ARG_INCLUDE_DIRECTORIES_PUBLIC)
            target_include_directories(${LIB_NAME} INTERFACE ${LIB_ARG_INCLUDE_DIRECTORIES_PUBLIC})
        endif()

        if(LIB_ARG_LINK_LIBRARIES_PUBLIC)
            target_link_libraries(${LIB_NAME} INTERFACE ${LIB_ARG_LINK_LIBRARIES_PUBLIC})
        endif()
    else()
        target_sources(${LIB_NAME} PRIVATE ${LIB_ARG_SOURCE_FILES})

        if(LIB_ARG_LINK_LIBRARIES_PUBLIC)
            target_link_libraries(${LIB_NAME} PUBLIC ${LIB_ARG_LINK_LIBRARIES_PUBLIC})
        endif()

        if(LIB_ARG_LINK_LIBRARIES_PRIVATE)
            target_link_libraries(${LIB_NAME} PRIVATE ${LIB_ARG_LINK_LIBRARIES_PRIVATE})
        endif()

        target_include_directories(
            ${LIB_NAME} 
            PUBLIC $<BUILD_INTERFACE:${LIB_ARG_HEADER_LOCATION}>
                   $<INSTALL_INTERFACE:${LIB_ARG_HEADER_INSTALL_LOCATION}>
        )

        if(LIB_ARG_INCLUDE_DIRECTORIES_PUBLIC)
            target_include_directories(${LIB_NAME} PUBLIC ${LIB_ARG_INCLUDE_DIRECTORIES_PUBLIC})
        endif()

        if(LIB_ARG_INCLUDE_DIRECTORIES_PRIVATE)
            target_include_directories(${LIB_NAME} PRIVATE ${LIB_ARG_INCLUDE_DIRECTORIES_PRIVATE})
        endif()
    endif()

    # Glob the header files in the provided location
    file(
        GLOB
        HEADER_FILES
        "${LIB_ARG_HEADER_LOCATION}/*.h"
        "${LIB_ARG_HEADER_LOCATION}/*.hpp"
    )

    # Install the library if the INSTALL option is specified
    if(${LIB_ARG_INSTALL})
        set_target_properties(${LIB_NAME} PROPERTIES PUBLIC_HEADER "${HEADER_FILES}")
        if(${LIB_TYPE} STREQUAL "INTERFACE")
            install(
                TARGETS ${LIB_NAME}
                EXPORT ${LIB_NAME}Targets # this exports the targets
                PUBLIC_HEADER DESTINATION ${LIB_ARG_HEADER_INSTALL_LOCATION}
            )
        else()
            install(
                TARGETS ${LIB_NAME}
                EXPORT ${LIB_NAME}Targets # this exports the targets
                LIBRARY DESTINATION lib
                PUBLIC_HEADER DESTINATION ${LIB_ARG_HEADER_INSTALL_LOCATION}
            )
        endif()

        # Export the targets to a CMake file for easy inclusion in other projects
        install(
            EXPORT ${LIB_NAME}Targets
            FILE ${LIB_NAME}Targets.cmake
            NAMESPACE ${LIB_NAME}::
            DESTINATION lib/cmake/${LIB_NAME}
        )
    endif()
endmacro()
 */