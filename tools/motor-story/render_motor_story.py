import math
import os
import sys

import bpy
from mathutils import Vector


FRAME_COUNT = 80
OUTPUT_SIZE = (1280, 800)


def argv_value(flag, default=None):
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if flag not in args:
        return default
    index = args.index(flag)
    return args[index + 1] if index + 1 < len(args) else default


def material(name, color, metallic=0.0, roughness=0.35):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1.0)
    value.use_nodes = True
    shader = value.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return value


def add_bevel(obj, width=0.0012, segments=3):
    modifier = obj.modifiers.new("Machined edge", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"


def add_cylinder(name, radius, depth, location, mat, vertices=96, bevel=0.0008):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_torus(name, major_radius, minor_radius, location, mat):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=96,
        minor_segments=20,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def add_box(name, size, location, mat, bevel=0.0007):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    add_bevel(obj, bevel)
    return obj


def add_bolt_ring(parent, z, radius, count, mat):
    for index in range(count):
        angle = index / count * math.tau
        bolt = add_cylinder(
            f"bolt-{z:.3f}-{index:02d}",
            0.00225,
            0.0022,
            (math.cos(angle) * radius, math.sin(angle) * radius, z),
            mat,
            vertices=24,
            bevel=0.00025,
        )
        bolt.parent = parent


def make_stator(copper, steel):
    parent = bpy.data.objects.new("stator-and-windings", None)
    bpy.context.collection.objects.link(parent)
    core = add_cylinder("stator-core", 0.037, 0.014, (0, 0, 0), steel, vertices=120)
    core.parent = parent
    for index in range(18):
        angle = index / 18 * math.tau
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        tooth = add_box(
            f"stator-tooth-{index:02d}",
            (0.013, 0.0054, 0.013),
            radial * 0.031,
            steel,
            bevel=0.00045,
        )
        tooth.rotation_euler.z = angle
        tooth.parent = parent
        for layer in (-0.0022, 0.0, 0.0022):
            coil = add_torus(
                f"copper-winding-{index:02d}-{layer:+.4f}",
                0.0034,
                0.00062,
                (radial.x * 0.035, radial.y * 0.035, layer),
                copper,
            )
            coil.rotation_euler.y = math.pi / 2
            coil.rotation_euler.x = angle
            coil.scale.x = 1.45
            coil.parent = parent
    return parent


def make_rotor(steel, magnet):
    parent = bpy.data.objects.new("rotor-and-shaft", None)
    bpy.context.collection.objects.link(parent)
    hub = add_cylinder("rotor-hub", 0.022, 0.018, (0, 0, 0), steel, vertices=96)
    shaft = add_cylinder("motor-shaft", 0.005, 0.068, (0, 0, 0), steel, vertices=64)
    hub.parent = parent
    shaft.parent = parent
    for index in range(14):
        angle = index / 14 * math.tau
        segment = add_box(
            f"rotor-magnet-{index:02d}",
            (0.0095, 0.0034, 0.015),
            (math.cos(angle) * 0.027, math.sin(angle) * 0.027, 0),
            magnet,
            bevel=0.00035,
        )
        segment.rotation_euler.z = angle
        segment.parent = parent
    return parent


def make_encoder(pcb, gold, steel):
    parent = bpy.data.objects.new("encoder-assembly", None)
    bpy.context.collection.objects.link(parent)
    board = add_cylinder("encoder-pcb", 0.033, 0.0022, (0, 0, 0), pcb, vertices=96, bevel=0.0003)
    ring = add_torus("encoder-track", 0.023, 0.0006, (0, 0, 0.00125), gold)
    sensor = add_box("encoder-sensor", (0.008, 0.004, 0.002), (0.025, 0, 0.002), steel, bevel=0.00025)
    board.parent = parent
    ring.parent = parent
    sensor.parent = parent
    return parent


def keyframe_part(obj, assembled_z, exploded_z, start=12, end=64):
    obj.location.z = assembled_z
    obj.keyframe_insert(data_path="location", frame=start)
    obj.location.z = exploded_z
    obj.keyframe_insert(data_path="location", frame=end)
    for curve in obj.animation_data.action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "BEZIER"
            point.easing = "EASE_IN_OUT"


def point_camera(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def import_reference_model(obj_path, dark_aluminum, brushed_aluminum):
    before = set(bpy.context.scene.objects)
    bpy.ops.wm.obj_import(filepath=obj_path, forward_axis="Y", up_axis="Z")
    imported = [item for item in bpy.context.scene.objects if item not in before and item.type == "MESH"]
    for item in imported:
        item.scale = (0.001, 0.001, 0.001)
        bpy.context.view_layer.objects.active = item
        item.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        item.select_set(False)
        item.data.materials.clear()
        item.data.materials.append(brushed_aluminum if "Output" in item.name else dark_aluminum)
        add_bevel(item, 0.00045, 2)
    output = next((item for item in imported if "Output" in item.name), None)
    housing = next((item for item in imported if item is not output), None)
    return housing, output


def setup_scene(obj_path, output_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = OUTPUT_SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.quality = 78
    scene.render.film_transparent = True
    scene.frame_start = 1
    scene.frame_end = FRAME_COUNT
    scene.render.filepath = os.path.join(output_dir, "frame-")
    scene.view_settings.look = "AgX - Medium High Contrast"

    dark_aluminum = material("Black anodized aluminum", (0.006, 0.009, 0.014), 0.78, 0.28)
    brushed_aluminum = material("Machined aluminum", (0.12, 0.16, 0.20), 0.86, 0.26)
    steel = material("Bearing steel", (0.055, 0.070, 0.085), 0.9, 0.2)
    copper = material("Copper windings", (0.28, 0.065, 0.012), 0.68, 0.24)
    magnet = material("Rotor magnets", (0.022, 0.09, 0.15), 0.72, 0.22)
    pcb = material("Encoder PCB", (0.018, 0.19, 0.13), 0.16, 0.3)
    gold = material("Encoder contacts", (0.72, 0.42, 0.08), 0.82, 0.18)

    housing, output = import_reference_model(obj_path, dark_aluminum, brushed_aluminum)
    if housing is None or output is None:
        raise RuntimeError("Reference OBJ must contain separate Output and housing meshes")

    front_bearing = add_torus("front-bearing", 0.018, 0.0037, (0, 0, 0), steel)
    stator = make_stator(copper, steel)
    rotor = make_rotor(steel, magnet)
    encoder = make_encoder(pcb, gold, steel)
    rear_bearing = add_torus("rear-bearing", 0.013, 0.0032, (0, 0, 0), steel)
    rear_cover = add_cylinder("rear-cover", 0.047, 0.004, (0, 0, 0), dark_aluminum, vertices=120)
    add_bolt_ring(rear_cover, 0.0022, 0.0405, 8, steel)

    keyframe_part(output, 0.0, 0.082)
    keyframe_part(front_bearing, 0.001, 0.056)
    keyframe_part(rotor, 0.0, 0.026)
    keyframe_part(stator, 0.0, 0.0)
    keyframe_part(housing, 0.0, -0.036)
    keyframe_part(encoder, -0.006, -0.067)
    keyframe_part(rear_bearing, -0.008, -0.090)
    keyframe_part(rear_cover, -0.010, -0.114)

    bpy.ops.object.light_add(type="AREA", location=(0.14, -0.13, 0.18))
    key = bpy.context.object
    key.data.energy = 120
    key.data.shape = "DISK"
    key.data.size = 0.12
    point_camera(key, (0, 0, 0))

    bpy.ops.object.light_add(type="AREA", location=(-0.15, -0.02, 0.08))
    fill = bpy.context.object
    fill.data.energy = 65
    fill.data.color = (0.34, 0.62, 1.0)
    fill.data.size = 0.10
    point_camera(fill, (0, 0, 0))

    bpy.ops.object.light_add(type="AREA", location=(0.06, 0.16, -0.04))
    rim = bpy.context.object
    rim.data.energy = 90
    rim.data.color = (0.32, 1.0, 0.72)
    rim.data.size = 0.08
    point_camera(rim, (0, 0, 0))

    bpy.ops.object.camera_add(location=(0.17, -0.20, 0.105))
    camera = bpy.context.object
    camera.data.lens = 58
    camera.data.sensor_width = 36
    point_camera(camera, (0, 0, 0.005))
    scene.camera = camera
    camera.keyframe_insert(data_path="location", frame=1)
    camera.keyframe_insert(data_path="rotation_euler", frame=1)
    camera.location = (0.20, -0.24, 0.12)
    point_camera(camera, (0, 0, -0.012))
    camera.keyframe_insert(data_path="location", frame=80)
    camera.keyframe_insert(data_path="rotation_euler", frame=80)

    world = bpy.data.worlds.new("Motor story world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.006, 0.009, 0.016, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.28
    scene.world = world

    return scene


def main():
    obj_path = os.path.abspath(argv_value("--input", "motor-reference.obj"))
    output_dir = os.path.abspath(argv_value("--output", "motor-story-frames"))
    os.makedirs(output_dir, exist_ok=True)
    scene = setup_scene(obj_path, output_dir)
    bpy.ops.render.render(animation=True)
    poster_source = os.path.join(output_dir, "frame-0001.webp")
    poster_target = os.path.join(output_dir, "poster.webp")
    if os.path.exists(poster_source):
        with open(poster_source, "rb") as source, open(poster_target, "wb") as target:
            target.write(source.read())
    print(f"Rendered {FRAME_COUNT} motor story frames to {output_dir}")


if __name__ == "__main__":
    main()
